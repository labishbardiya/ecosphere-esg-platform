"use server"

import { db } from "@/lib/db"
import { challenges, challengeParticipants, user } from "@/lib/db/schema"
import { getUserId } from "@/lib/session"
import { and, eq, gte, lte, desc, sql } from "drizzle-orm"

export async function getActiveChallenges() {
  const now = new Date()
  return db
    .select()
    .from(challenges)
    .where(
      and(
        eq(challenges.isActive, true),
        gte(challenges.endDate, now),
      ),
    )
    .orderBy(desc(challenges.createdAt))
}

export async function getPastChallenges() {
  const now = new Date()
  return db
    .select()
    .from(challenges)
    .where(
      and(
        eq(challenges.isActive, true),
        lte(challenges.endDate, now),
      ),
    )
    .orderBy(desc(challenges.endDate))
}

export async function getAllChallenges() {
  return db.select().from(challenges).orderBy(desc(challenges.createdAt))
}

export async function joinChallenge(challengeId: number) {
  const userId = await getUserId()
  const existing = await db
    .select()
    .from(challengeParticipants)
    .where(
      and(
        eq(challengeParticipants.challengeId, challengeId),
        eq(challengeParticipants.userId, userId),
      ),
    )
    .then((r) => r[0])

  if (existing) return { error: "Already joined this challenge" }

  await db.insert(challengeParticipants).values({
    challengeId,
    userId,
    status: "in_progress",
  })

  return { success: true }
}

export async function completeChallenge(challengeId: number, proofUrl?: string) {
  const userId = await getUserId()

  const participation = await db
    .select()
    .from(challengeParticipants)
    .where(
      and(
        eq(challengeParticipants.challengeId, challengeId),
        eq(challengeParticipants.userId, userId),
      ),
    )
    .then((r) => r[0])

  if (!participation) return { error: "Not participating in this challenge" }
  if (participation.status === "completed") return { error: "Already completed" }

  const challenge = await db
    .select()
    .from(challenges)
    .where(eq(challenges.id, challengeId))
    .then((r) => r[0])

  if (!challenge) return { error: "Challenge not found" }

  await db
    .update(challengeParticipants)
    .set({
      status: "completed",
      proofUrl: proofUrl ?? null,
      completedAt: new Date(),
    })
    .where(eq(challengeParticipants.id, participation.id))

  await db
    .update(user)
    .set({
      xpBalance: sql`${user.xpBalance} + ${challenge.xpReward}`,
      pointsBalance: sql`${user.pointsBalance} + ${challenge.pointsReward}`,
    })
    .where(eq(user.id, userId))

  // Auto-award badges after XP/challenge completion (Section 8)
  const { checkAndAwardBadgesForUser } = await import(
    "@/app/actions/gamification/badges"
  )
  const badgesAwarded = await checkAndAwardBadgesForUser(userId)

  return {
    success: true,
    xpReward: challenge.xpReward,
    pointsReward: challenge.pointsReward,
    badgesAwarded,
  }
}

export async function getUserChallengeStatus() {
  const userId = await getUserId()
  return db
    .select({
      challengeId: challengeParticipants.challengeId,
      status: challengeParticipants.status,
      completedAt: challengeParticipants.completedAt,
    })
    .from(challengeParticipants)
    .where(eq(challengeParticipants.userId, userId))
}
