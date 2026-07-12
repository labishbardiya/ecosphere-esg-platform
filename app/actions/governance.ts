"use server"

import { revalidatePath } from "next/cache"
import { and, desc, eq, ne, sql } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/lib/db"
import {
  audits,
  complianceIssues,
  departments,
  policies,
  policyAcknowledgements,
  user,
} from "@/lib/db/schema"
import {
  requireActionAdmin,
  requireActionReviewer,
  requireActionUser,
} from "@/lib/action-auth"
import {
  createNotification,
  isNotifyEnabled,
} from "@/lib/notifications"

const policySchema = z.object({
  title: z.string().min(2).max(200),
  version: z.string().min(1).max(20).default("1.0"),
  content: z.string().min(10).max(20000),
  status: z.enum(["draft", "active", "archived"]).default("active"),
})

const issueSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(5000).optional(),
  auditId: z.coerce.number().int().positive().optional().nullable(),
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  ownerId: z.string().min(1),
  departmentId: z.coerce.number().int().positive().optional().nullable(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

const auditSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(5000).optional(),
  departmentId: z.coerce.number().int().positive().optional().nullable(),
  status: z
    .enum(["scheduled", "in_progress", "review", "completed"])
    .default("scheduled"),
  scheduledDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
})

export async function getPolicies() {
  await requireActionUser()
  return db.select().from(policies).orderBy(desc(policies.createdAt))
}

export async function createPolicy(input: z.infer<typeof policySchema>) {
  const actor = await requireActionAdmin()
  const data = policySchema.parse(input)
  const [row] = await db
    .insert(policies)
    .values({
      title: data.title,
      version: data.version,
      content: data.content,
      status: data.status,
      publishedAt: data.status === "active" ? new Date() : null,
      createdBy: actor.id,
    })
    .returning({ id: policies.id })

  // Seed acknowledgements for all users when policy is active
  if (data.status === "active") {
    const users = await db.select({ id: user.id }).from(user)
    if (users.length) {
      await db.insert(policyAcknowledgements).values(
        users.map((u) => ({
          policyId: row.id,
          userId: u.id,
          status: "pending" as const,
        })),
      )
      if (await isNotifyEnabled("notify_policy_reminders")) {
        for (const u of users) {
          await createNotification({
            userId: u.id,
            type: "policy_reminder",
            title: "New policy requires acknowledgement",
            body: data.title,
            href: "/governance",
          })
        }
      }
    }
  }

  revalidatePath("/governance")
  return { success: true as const, id: row.id }
}

export async function getMyPolicyAcks() {
  const actor = await requireActionUser()
  return db
    .select({
      id: policyAcknowledgements.id,
      status: policyAcknowledgements.status,
      acknowledgedAt: policyAcknowledgements.acknowledgedAt,
      policyId: policies.id,
      title: policies.title,
      version: policies.version,
      content: policies.content,
    })
    .from(policyAcknowledgements)
    .innerJoin(policies, eq(policyAcknowledgements.policyId, policies.id))
    .where(
      and(
        eq(policyAcknowledgements.userId, actor.id),
        eq(policies.status, "active"),
      ),
    )
    .orderBy(desc(policies.createdAt))
}

export async function acknowledgePolicy(
  policyId: number,
  decision: "accepted" | "rejected",
) {
  const actor = await requireActionUser()
  const ack = await db
    .select()
    .from(policyAcknowledgements)
    .where(
      and(
        eq(policyAcknowledgements.policyId, policyId),
        eq(policyAcknowledgements.userId, actor.id),
      ),
    )
    .then((r) => r[0])

  if (!ack) {
    await db.insert(policyAcknowledgements).values({
      policyId,
      userId: actor.id,
      status: decision,
      acknowledgedAt: new Date(),
    })
  } else {
    await db
      .update(policyAcknowledgements)
      .set({ status: decision, acknowledgedAt: new Date() })
      .where(eq(policyAcknowledgements.id, ack.id))
  }

  revalidatePath("/governance")
  revalidatePath("/dashboard")
  return { success: true as const }
}

export async function getAudits() {
  await requireActionUser()
  return db
    .select({
      id: audits.id,
      title: audits.title,
      description: audits.description,
      status: audits.status,
      scheduledDate: audits.scheduledDate,
      completedDate: audits.completedDate,
      findings: audits.findings,
      recommendations: audits.recommendations,
      departmentId: audits.departmentId,
      departmentName: departments.name,
    })
    .from(audits)
    .leftJoin(departments, eq(audits.departmentId, departments.id))
    .orderBy(desc(audits.createdAt))
}

export async function createAudit(input: z.infer<typeof auditSchema>) {
  const actor = await requireActionReviewer()
  const data = auditSchema.parse(input)
  const [row] = await db
    .insert(audits)
    .values({
      title: data.title,
      description: data.description ?? null,
      departmentId: data.departmentId ?? null,
      status: data.status,
      scheduledDate: data.scheduledDate ?? null,
      createdBy: actor.id,
    })
    .returning({ id: audits.id })
  revalidatePath("/governance")
  return { success: true as const, id: row.id }
}

export async function updateAuditStatus(
  id: number,
  status: "scheduled" | "in_progress" | "review" | "completed",
  findings?: string,
  recommendations?: string,
) {
  await requireActionReviewer()
  await db
    .update(audits)
    .set({
      status,
      findings: findings ?? undefined,
      recommendations: recommendations ?? undefined,
      completedDate:
        status === "completed"
          ? new Date().toISOString().slice(0, 10)
          : undefined,
    })
    .where(eq(audits.id, id))
  revalidatePath("/governance")
  return { success: true as const }
}

export async function getComplianceIssues() {
  await requireActionUser()
  return db
    .select({
      id: complianceIssues.id,
      title: complianceIssues.title,
      description: complianceIssues.description,
      severity: complianceIssues.severity,
      status: complianceIssues.status,
      dueDate: complianceIssues.dueDate,
      ownerId: complianceIssues.ownerId,
      ownerName: user.name,
      departmentId: complianceIssues.departmentId,
      departmentName: departments.name,
      createdAt: complianceIssues.createdAt,
    })
    .from(complianceIssues)
    .leftJoin(user, eq(complianceIssues.ownerId, user.id))
    .leftJoin(departments, eq(complianceIssues.departmentId, departments.id))
    .orderBy(desc(complianceIssues.createdAt))
}

export async function createComplianceIssue(
  input: z.infer<typeof issueSchema>,
) {
  const actor = await requireActionReviewer()
  const data = issueSchema.parse(input)

  // Business rule: owner + due date required (enforced by schema)
  const owner = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, data.ownerId))
    .then((r) => r[0])
  if (!owner) return { error: "Owner user not found" }

  const [row] = await db
    .insert(complianceIssues)
    .values({
      title: data.title,
      description: data.description ?? null,
      auditId: data.auditId ?? null,
      severity: data.severity,
      ownerId: data.ownerId,
      departmentId: data.departmentId ?? null,
      dueDate: data.dueDate,
      status: "assigned",
      createdBy: actor.id,
    })
    .returning({ id: complianceIssues.id })

  if (await isNotifyEnabled("notify_compliance")) {
    await createNotification({
      userId: data.ownerId,
      type: "compliance_issue",
      title: "Compliance issue assigned to you",
      body: `${data.title} (due ${data.dueDate})`,
      href: "/governance",
    })
  }

  revalidatePath("/governance")
  revalidatePath("/dashboard")
  return { success: true as const, id: row.id }
}

export async function updateIssueStatus(
  id: number,
  status: "open" | "assigned" | "in_progress" | "resolved" | "closed",
) {
  await requireActionUser()
  await db
    .update(complianceIssues)
    .set({
      status,
      resolvedAt:
        status === "resolved" || status === "closed" ? new Date() : null,
    })
    .where(eq(complianceIssues.id, id))
  revalidatePath("/governance")
  revalidatePath("/dashboard")
  return { success: true as const }
}

export async function getAssignableUsers() {
  await requireActionUser()
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      departmentId: user.departmentId,
    })
    .from(user)
    .orderBy(user.name)
}

export async function getGovernanceStats() {
  await requireActionUser()
  const [activePolicies] = await db
    .select({ c: sql<string>`count(*)` })
    .from(policies)
    .where(eq(policies.status, "active"))
  const [openIssues] = await db
    .select({ c: sql<string>`count(*)` })
    .from(complianceIssues)
    .where(
      and(
        ne(complianceIssues.status, "resolved"),
        ne(complianceIssues.status, "closed"),
      ),
    )
  const [overdue] = await db
    .select({ c: sql<string>`count(*)` })
    .from(complianceIssues)
    .where(
      and(
        ne(complianceIssues.status, "resolved"),
        ne(complianceIssues.status, "closed"),
        sql`${complianceIssues.dueDate}::date < current_date`,
      ),
    )
  const [auditsOpen] = await db
    .select({ c: sql<string>`count(*)` })
    .from(audits)
    .where(ne(audits.status, "completed"))
  const [pendingAcks] = await db
    .select({ c: sql<string>`count(*)` })
    .from(policyAcknowledgements)
    .where(eq(policyAcknowledgements.status, "pending"))

  return {
    activePolicies: Number(activePolicies?.c ?? 0),
    openIssues: Number(openIssues?.c ?? 0),
    overdueIssues: Number(overdue?.c ?? 0),
    openAudits: Number(auditsOpen?.c ?? 0),
    pendingAcks: Number(pendingAcks?.c ?? 0),
  }
}
