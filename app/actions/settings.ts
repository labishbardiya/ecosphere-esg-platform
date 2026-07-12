"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { categories, departments } from "@/lib/db/schema"
import { requireActionAdmin, requireActionUser } from "@/lib/action-auth"
import { getAllSettings, setSetting } from "@/lib/org-settings"

export async function getOrgSettingsAction() {
  await requireActionAdmin()
  return getAllSettings()
}

const weightsSchema = z.object({
  weight_environmental: z.coerce.number().min(0).max(1),
  weight_social: z.coerce.number().min(0).max(1),
  weight_governance: z.coerce.number().min(0).max(1),
})

export async function updateEsgWeights(input: z.infer<typeof weightsSchema>) {
  await requireActionAdmin()
  const data = weightsSchema.parse(input)
  await setSetting("weight_environmental", String(data.weight_environmental))
  await setSetting("weight_social", String(data.weight_social))
  await setSetting("weight_governance", String(data.weight_governance))
  revalidatePath("/settings")
  revalidatePath("/dashboard")
  revalidatePath("/reports")
  return { success: true as const }
}

export async function updateFeatureToggles(input: Record<string, boolean>) {
  await requireActionAdmin()
  const allowed = [
    "require_csr_evidence",
    "badge_auto_award",
    "notify_compliance",
    "notify_csr_decisions",
    "notify_badge_unlocks",
    "notify_policy_reminders",
  ]
  for (const key of allowed) {
    if (key in input) {
      await setSetting(key, input[key] ? "true" : "false")
    }
  }
  revalidatePath("/settings")
  return { success: true as const }
}

export async function listDepartmentsAdmin() {
  await requireActionUser()
  return db.select().from(departments).orderBy(departments.name)
}

export async function createDepartment(name: string, description?: string) {
  await requireActionAdmin()
  const n = z.string().min(2).max(100).parse(name)
  await db.insert(departments).values({
    name: n,
    description: description ?? null,
  })
  revalidatePath("/settings")
  revalidatePath("/sign-up")
  return { success: true as const }
}

export async function listCategoriesAdmin() {
  await requireActionAdmin()
  return db.select().from(categories).orderBy(categories.type, categories.name)
}

export async function createCategory(name: string, type: "csr" | "challenge") {
  await requireActionAdmin()
  const n = z.string().min(2).max(100).parse(name)
  const t = z.enum(["csr", "challenge"]).parse(type)
  await db.insert(categories).values({ name: n, type: t })
  revalidatePath("/settings")
  revalidatePath("/social")
  return { success: true as const }
}

export async function setCategoryActive(id: number, isActive: boolean) {
  await requireActionAdmin()
  await db
    .update(categories)
    .set({ isActive })
    .where(eq(categories.id, id))
  revalidatePath("/settings")
  return { success: true as const }
}
