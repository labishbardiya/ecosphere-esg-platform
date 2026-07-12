"use server"

import { revalidatePath } from "next/cache"
import { and, desc, eq, gte, lte, sql } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/lib/db"
import {
  carbonTransactions,
  emissionFactors,
  environmentalGoals,
  resourceUsage,
  wasteLogs,
} from "@/lib/db/schema"
import { getSessionUser } from "@/lib/session"

// ------------------------------------------------------------
// Auth helpers for actions (throw instead of redirect)
// ------------------------------------------------------------

async function requireActionUser() {
  const user = await getSessionUser()
  if (!user) throw new Error("Unauthorized")
  return user
}

async function requireActionAdmin() {
  const user = await requireActionUser()
  if (user.role !== "admin") throw new Error("Forbidden: admin only")
  return user
}

// ------------------------------------------------------------
// E1. Emission factors (admin CRUD, versioned)
// ------------------------------------------------------------

const factorSchema = z.object({
  activityType: z.string().min(2).max(100),
  unit: z.string().min(1).max(40),
  factorKgCo2e: z.coerce.number().nonnegative(),
  source: z.string().min(2).max(200),
  validFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export async function getEmissionFactors(includeInactive = false) {
  await requireActionUser()
  return db
    .select()
    .from(emissionFactors)
    .where(includeInactive ? undefined : eq(emissionFactors.isActive, true))
    .orderBy(emissionFactors.activityType, desc(emissionFactors.validFrom))
}

export async function createEmissionFactor(input: z.infer<typeof factorSchema>) {
  await requireActionAdmin()
  const data = factorSchema.parse(input)
  await db.insert(emissionFactors).values({
    activityType: data.activityType,
    unit: data.unit,
    factorKgCo2e: String(data.factorKgCo2e),
    source: data.source,
    validFrom: data.validFrom,
  })
  revalidatePath("/environmental/factors")
}

export async function setFactorActive(id: number, isActive: boolean) {
  await requireActionAdmin()
  await db
    .update(emissionFactors)
    .set({ isActive })
    .where(eq(emissionFactors.id, id))
  revalidatePath("/environmental/factors")
}

// ------------------------------------------------------------
// E2. Carbon transactions (auto-calc, factor snapshot)
// ------------------------------------------------------------

const txSchema = z.object({
  sourceType: z.enum([
    "purchase",
    "manufacturing",
    "expense",
    "fleet",
    "energy",
    "travel",
    "other",
  ]),
  description: z.string().min(2).max(300),
  factorId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().positive(),
  departmentId: z.coerce.number().int().positive(),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export async function createCarbonTransaction(input: z.infer<typeof txSchema>) {
  const user = await requireActionUser()
  const data = txSchema.parse(input)

  const [factor] = await db
    .select()
    .from(emissionFactors)
    .where(
      and(eq(emissionFactors.id, data.factorId), eq(emissionFactors.isActive, true)),
    )
  if (!factor) throw new Error("Emission factor not found or inactive")

  // Business rule: total = quantity x factor, snapshotted for auditability.
  const totalKgCo2e = data.quantity * Number(factor.factorKgCo2e)

  await db.insert(carbonTransactions).values({
    sourceType: data.sourceType,
    description: data.description,
    activityType: factor.activityType,
    quantity: String(data.quantity),
    unit: factor.unit,
    factorKgCo2e: factor.factorKgCo2e,
    totalKgCo2e: totalKgCo2e.toFixed(4),
    departmentId: data.departmentId,
    userId: user.id,
    transactionDate: data.transactionDate,
  })
  revalidatePath("/environmental")
  revalidatePath("/environmental/transactions")
}

const txFilterSchema = z.object({
  departmentId: z.coerce.number().int().positive().optional(),
  sourceType: z.string().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export async function getCarbonTransactions(
  filters: z.infer<typeof txFilterSchema> = {},
) {
  const user = await requireActionUser()
  const f = txFilterSchema.parse(filters)

  const conditions = [
    // Employees see only their own entries; admins see everything.
    ...(user.role === "admin" ? [] : [eq(carbonTransactions.userId, user.id)]),
    ...(f.departmentId ? [eq(carbonTransactions.departmentId, f.departmentId)] : []),
    ...(f.sourceType ? [eq(carbonTransactions.sourceType, f.sourceType)] : []),
    ...(f.from ? [gte(carbonTransactions.transactionDate, f.from)] : []),
    ...(f.to ? [lte(carbonTransactions.transactionDate, f.to)] : []),
  ]

  return db
    .select()
    .from(carbonTransactions)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(carbonTransactions.transactionDate), desc(carbonTransactions.id))
    .limit(200)
}

export async function deleteCarbonTransaction(id: number) {
  const user = await requireActionUser()
  await db
    .delete(carbonTransactions)
    .where(
      user.role === "admin"
        ? eq(carbonTransactions.id, id)
        : and(eq(carbonTransactions.id, id), eq(carbonTransactions.userId, user.id)),
    )
  revalidatePath("/environmental/transactions")
}

// ------------------------------------------------------------
// E3. Resource usage (monthly, per department)
// ------------------------------------------------------------

const resourceSchema = z.object({
  resourceType: z.enum(["electricity", "water", "paper", "fuel"]),
  quantity: z.coerce.number().nonnegative(),
  departmentId: z.coerce.number().int().positive(),
  periodMonth: z.string().regex(/^\d{4}-\d{2}$/),
  notes: z.string().max(300).optional(),
})

const RESOURCE_UNITS: Record<string, string> = {
  electricity: "kWh",
  water: "litres",
  paper: "kg",
  fuel: "litres",
}

export async function upsertResourceUsage(input: z.infer<typeof resourceSchema>) {
  const user = await requireActionUser()
  const data = resourceSchema.parse(input)
  const periodDate = `${data.periodMonth}-01`

  await db
    .insert(resourceUsage)
    .values({
      resourceType: data.resourceType,
      quantity: String(data.quantity),
      unit: RESOURCE_UNITS[data.resourceType],
      departmentId: data.departmentId,
      userId: user.id,
      periodMonth: periodDate,
      notes: data.notes,
    })
    .onConflictDoUpdate({
      target: [
        resourceUsage.resourceType,
        resourceUsage.departmentId,
        resourceUsage.periodMonth,
      ],
      set: {
        quantity: String(data.quantity),
        notes: data.notes,
        userId: user.id,
      },
    })
  revalidatePath("/environmental/resources")
}

export async function getResourceUsage(months = 12) {
  await requireActionUser()
  return db
    .select()
    .from(resourceUsage)
    .where(
      gte(
        resourceUsage.periodMonth,
        sql`(CURRENT_DATE - ${sql.raw(`INTERVAL '${Math.max(1, Math.min(months, 36))} months'`)})::date`,
      ),
    )
    .orderBy(desc(resourceUsage.periodMonth))
}

// ------------------------------------------------------------
// E4. Waste logs + recycling rate (GRI 306)
// ------------------------------------------------------------

const wasteSchema = z.object({
  category: z.enum(["recycled", "landfill", "e-waste", "organic", "hazardous"]),
  weightKg: z.coerce.number().positive(),
  departmentId: z.coerce.number().int().positive(),
  logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(300).optional(),
})

export async function createWasteLog(input: z.infer<typeof wasteSchema>) {
  const user = await requireActionUser()
  const data = wasteSchema.parse(input)
  await db.insert(wasteLogs).values({
    category: data.category,
    weightKg: String(data.weightKg),
    departmentId: data.departmentId,
    userId: user.id,
    logDate: data.logDate,
    notes: data.notes,
  })
  revalidatePath("/environmental/waste")
  revalidatePath("/environmental")
}

export async function getWasteLogs() {
  await requireActionUser()
  return db
    .select()
    .from(wasteLogs)
    .orderBy(desc(wasteLogs.logDate), desc(wasteLogs.id))
    .limit(200)
}

// ------------------------------------------------------------
// E5. Environmental goals (admin)
// ------------------------------------------------------------

const goalSchema = z.object({
  title: z.string().min(2).max(200),
  metric: z.enum([
    "emissions_reduction",
    "recycling_rate",
    "electricity_reduction",
    "water_reduction",
    "paper_reduction",
    "fuel_reduction",
  ]),
  targetValue: z.coerce.number().positive(),
  unit: z.string().min(1).max(40),
  baselineValue: z.coerce.number().nonnegative().optional(),
  departmentId: z.coerce.number().int().positive().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export async function createGoal(input: z.infer<typeof goalSchema>) {
  const admin = await requireActionAdmin()
  const data = goalSchema.parse(input)
  if (data.endDate <= data.startDate) throw new Error("End date must be after start date")
  await db.insert(environmentalGoals).values({
    title: data.title,
    metric: data.metric,
    targetValue: String(data.targetValue),
    unit: data.unit,
    baselineValue: data.baselineValue != null ? String(data.baselineValue) : null,
    departmentId: data.departmentId,
    startDate: data.startDate,
    endDate: data.endDate,
    createdBy: admin.id,
  })
  revalidatePath("/environmental/goals")
}

export async function updateGoalStatus(
  id: number,
  status: "active" | "achieved" | "missed" | "archived",
) {
  await requireActionAdmin()
  await db
    .update(environmentalGoals)
    .set({ status })
    .where(eq(environmentalGoals.id, id))
  revalidatePath("/environmental/goals")
}

export async function getGoals() {
  await requireActionUser()
  return db
    .select()
    .from(environmentalGoals)
    .orderBy(desc(environmentalGoals.createdAt))
}
