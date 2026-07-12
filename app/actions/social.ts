"use server"

import { revalidatePath } from "next/cache"
import { and, desc, eq, sql } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/lib/db"
import {
  categories,
  csrActivities,
  csrParticipation,
  user,
} from "@/lib/db/schema"
import {
  requireActionAdmin,
  requireActionReviewer,
  requireActionUser,
} from "@/lib/action-auth"
import { getBoolSetting } from "@/lib/org-settings"
import {
  createNotification,
  isNotifyEnabled,
} from "@/lib/notifications"
import { checkAndAwardBadgesForUser } from "@/app/actions/gamification/badges"

const activitySchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  categoryId: z.coerce.number().int().positive().optional().nullable(),
  location: z.string().max(200).optional(),
  capacity: z.coerce.number().int().positive().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  pointsReward: z.coerce.number().int().min(0).max(1000).default(20),
  status: z
    .enum(["upcoming", "active", "completed", "cancelled"])
    .default("upcoming"),
})

export async function getCsrCategories() {
  await requireActionUser()
  return db
    .select()
    .from(categories)
    .where(and(eq(categories.type, "csr"), eq(categories.isActive, true)))
    .orderBy(categories.name)
}

export async function getCsrActivities() {
  await requireActionUser()
  const rows = await db
    .select({
      id: csrActivities.id,
      title: csrActivities.title,
      description: csrActivities.description,
      location: csrActivities.location,
      capacity: csrActivities.capacity,
      startDate: csrActivities.startDate,
      endDate: csrActivities.endDate,
      pointsReward: csrActivities.pointsReward,
      status: csrActivities.status,
      categoryId: csrActivities.categoryId,
      categoryName: categories.name,
    })
    .from(csrActivities)
    .leftJoin(categories, eq(csrActivities.categoryId, categories.id))
    .orderBy(desc(csrActivities.createdAt))

  const counts = await db
    .select({
      activityId: csrParticipation.activityId,
      c: sql<string>`count(*)`,
    })
    .from(csrParticipation)
    .groupBy(csrParticipation.activityId)
  const countMap = new Map(counts.map((r) => [r.activityId, Number(r.c)]))

  return rows.map((r) => ({
    ...r,
    participantCount: countMap.get(r.id) ?? 0,
  }))
}

export async function createCsrActivity(input: z.infer<typeof activitySchema>) {
  const actor = await requireActionReviewer()
  const data = activitySchema.parse(input)
  const [row] = await db
    .insert(csrActivities)
    .values({
      title: data.title,
      description: data.description ?? null,
      categoryId: data.categoryId ?? null,
      location: data.location ?? null,
      capacity: data.capacity ?? null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      pointsReward: data.pointsReward,
      status: data.status,
      organizerId: actor.id,
    })
    .returning({ id: csrActivities.id })
  revalidatePath("/social")
  return { success: true as const, id: row.id }
}

export async function joinCsrActivity(activityId: number, proofUrl?: string) {
  const actor = await requireActionUser()
  const activity = await db
    .select()
    .from(csrActivities)
    .where(eq(csrActivities.id, activityId))
    .then((r) => r[0])
  if (!activity) return { error: "Activity not found" }
  if (activity.status === "cancelled" || activity.status === "completed") {
    return { error: "Activity is not open for participation" }
  }

  const existing = await db
    .select()
    .from(csrParticipation)
    .where(
      and(
        eq(csrParticipation.activityId, activityId),
        eq(csrParticipation.userId, actor.id),
      ),
    )
    .then((r) => r[0])
  if (existing) return { error: "Already joined this activity" }

  if (activity.capacity) {
    const [cnt] = await db
      .select({ c: sql<string>`count(*)` })
      .from(csrParticipation)
      .where(eq(csrParticipation.activityId, activityId))
    if (Number(cnt.c) >= activity.capacity) {
      return { error: "Activity is at capacity" }
    }
  }

  await db.insert(csrParticipation).values({
    activityId,
    userId: actor.id,
    status: "pending",
    proofUrl: proofUrl?.trim() || null,
  })

  revalidatePath("/social")
  return { success: true as const }
}

export async function submitCsrProof(participationId: number, proofUrl: string) {
  const actor = await requireActionUser()
  const url = z.string().min(3).max(500).parse(proofUrl)
  const part = await db
    .select()
    .from(csrParticipation)
    .where(eq(csrParticipation.id, participationId))
    .then((r) => r[0])
  if (!part || part.userId !== actor.id) return { error: "Not found" }
  if (part.status === "approved") return { error: "Already approved" }

  await db
    .update(csrParticipation)
    .set({ proofUrl: url, status: "pending" })
    .where(eq(csrParticipation.id, participationId))

  revalidatePath("/social")
  return { success: true as const }
}

export async function reviewCsrParticipation(
  participationId: number,
  decision: "approved" | "rejected",
) {
  const reviewer = await requireActionReviewer()
  const part = await db
    .select()
    .from(csrParticipation)
    .where(eq(csrParticipation.id, participationId))
    .then((r) => r[0])
  if (!part) return { error: "Participation not found" }
  if (part.status !== "pending") return { error: "Already reviewed" }

  const activity = await db
    .select()
    .from(csrActivities)
    .where(eq(csrActivities.id, part.activityId))
    .then((r) => r[0])
  if (!activity) return { error: "Activity not found" }

  if (decision === "approved") {
    const requireEvidence = await getBoolSetting("require_csr_evidence")
    if (requireEvidence && !part.proofUrl) {
      return { error: "Proof required before approval (org setting)" }
    }
  }

  const points =
    decision === "approved" ? activity.pointsReward : 0

  await db.transaction(async (tx) => {
    await tx
      .update(csrParticipation)
      .set({
        status: decision,
        pointsEarned: points,
        completedAt: decision === "approved" ? new Date() : null,
        reviewedBy: reviewer.id,
        reviewedAt: new Date(),
      })
      .where(eq(csrParticipation.id, participationId))

    if (decision === "approved" && points > 0) {
      await tx
        .update(user)
        .set({
          pointsBalance: sql`${user.pointsBalance} + ${points}`,
          xpBalance: sql`${user.xpBalance} + ${Math.round(points / 2)}`,
        })
        .where(eq(user.id, part.userId))
    }
  })

  if (await isNotifyEnabled("notify_csr_decisions")) {
    await createNotification({
      userId: part.userId,
      type: "csr_decision",
      title:
        decision === "approved"
          ? "CSR participation approved"
          : "CSR participation rejected",
      body:
        decision === "approved"
          ? `You earned ${points} points for "${activity.title}".`
          : `Your participation in "${activity.title}" was rejected.`,
      href: "/social",
    })
  }

  if (decision === "approved") {
    await checkAndAwardBadgesForUser(part.userId)
  }

  revalidatePath("/social")
  revalidatePath("/gamification")
  revalidatePath("/dashboard")
  return { success: true as const, points }
}

export async function getMyCsrParticipations() {
  const actor = await requireActionUser()
  return db
    .select({
      id: csrParticipation.id,
      status: csrParticipation.status,
      proofUrl: csrParticipation.proofUrl,
      pointsEarned: csrParticipation.pointsEarned,
      activityId: csrActivities.id,
      activityTitle: csrActivities.title,
      pointsReward: csrActivities.pointsReward,
    })
    .from(csrParticipation)
    .innerJoin(
      csrActivities,
      eq(csrParticipation.activityId, csrActivities.id),
    )
    .where(eq(csrParticipation.userId, actor.id))
    .orderBy(desc(csrParticipation.createdAt))
}

export async function getPendingCsrReviews() {
  await requireActionReviewer()
  return db
    .select({
      id: csrParticipation.id,
      status: csrParticipation.status,
      proofUrl: csrParticipation.proofUrl,
      userId: csrParticipation.userId,
      userName: user.name,
      userEmail: user.email,
      activityTitle: csrActivities.title,
      pointsReward: csrActivities.pointsReward,
      createdAt: csrParticipation.createdAt,
    })
    .from(csrParticipation)
    .innerJoin(
      csrActivities,
      eq(csrParticipation.activityId, csrActivities.id),
    )
    .innerJoin(user, eq(csrParticipation.userId, user.id))
    .where(eq(csrParticipation.status, "pending"))
    .orderBy(desc(csrParticipation.createdAt))
}

export async function getSocialStats() {
  await requireActionUser()
  const [acts] = await db
    .select({ c: sql<string>`count(*)` })
    .from(csrActivities)
    .where(sql`${csrActivities.status} != 'cancelled'`)
  const [pending] = await db
    .select({ c: sql<string>`count(*)` })
    .from(csrParticipation)
    .where(eq(csrParticipation.status, "pending"))
  const [approved] = await db
    .select({ c: sql<string>`count(*)` })
    .from(csrParticipation)
    .where(eq(csrParticipation.status, "approved"))
  return {
    activities: Number(acts?.c ?? 0),
    pending: Number(pending?.c ?? 0),
    approved: Number(approved?.c ?? 0),
  }
}

// keep admin import available for future bulk ops
void requireActionAdmin
