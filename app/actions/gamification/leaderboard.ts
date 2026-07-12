"use server"

import { db } from "@/lib/db"
import { user, challengeParticipants, badges, userBadges } from "@/lib/db/schema"
import { eq, and, count, desc, sql } from "drizzle-orm"

export async function getLeaderboard(limit = 20) {
  return db
    .select({
      id: user.id,
      name: user.name,
      role: user.role,
      xpBalance: user.xpBalance,
      pointsBalance: user.pointsBalance,
    })
    .from(user)
    .orderBy(desc(user.xpBalance))
    .limit(limit)
}

export async function getUserRank() {
  const allUsers = await db
    .select({
      id: user.id,
      xpBalance: user.xpBalance,
    })
    .from(user)
    .orderBy(desc(user.xpBalance))
}

export async function getLeaderboardWithMeta(limit = 20) {
  const entries = await db
    .select({
      id: user.id,
      name: user.name,
      role: user.role,
      xpBalance: user.xpBalance,
      pointsBalance: user.pointsBalance,
    })
    .from(user)
    .orderBy(desc(user.xpBalance))
    .limit(limit)

  const enriched = await Promise.all(
    entries.map(async (entry) => {
      const completedCount = await db
        .select({ count: count() })
        .from(challengeParticipants)
        .where(
          and(
            eq(challengeParticipants.userId, entry.id),
            eq(challengeParticipants.status, "completed"),
          ),
        )
        .then((r) => r[0]?.count ?? 0)

      const badgeCount = await db
        .select({ count: count() })
        .from(userBadges)
        .where(eq(userBadges.userId, entry.id))
        .then((r) => r[0]?.count ?? 0)

      return { ...entry, completedChallenges: completedCount, badgeCount }
    }),
  )

  return enriched
}
