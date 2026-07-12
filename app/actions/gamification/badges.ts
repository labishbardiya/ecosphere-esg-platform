"use server"

import { db } from "@/lib/db"
import { badges, userBadges, challengeParticipants, user } from "@/lib/db/schema"
import { getUserId } from "@/lib/session"
import { eq, and, count, desc, sql } from "drizzle-orm"

export async function getAllBadges() {
  return db.select().from(badges).orderBy(badges.name)
}

export async function getUserBadges() {
  const userId = await getUserId()
  return db
    .select({
      id: userBadges.id,
      badgeId: userBadges.badgeId,
      earnedAt: userBadges.earnedAt,
      badgeName: badges.name,
      badgeDescription: badges.description,
      badgeIcon: badges.icon,
      badgeCategory: badges.category,
    })
    .from(userBadges)
    .innerJoin(badges, eq(userBadges.badgeId, badges.id))
    .where(eq(userBadges.userId, userId))
    .orderBy(desc(userBadges.earnedAt))
}

/** Award badges for any user (used by CSR approve + challenge complete). */
export async function checkAndAwardBadgesForUser(userId: string) {
  const { getBoolSetting } = await import("@/lib/org-settings")
  const auto = await getBoolSetting("badge_auto_award")
  if (!auto) return [] as string[]

  const userData = await db
    .select({ xpBalance: user.xpBalance })
    .from(user)
    .where(eq(user.id, userId))
    .then((r) => r[0])

  if (!userData) return [] as string[]

  const completedChallenges = await db
    .select({ count: count() })
    .from(challengeParticipants)
    .where(
      and(
        eq(challengeParticipants.userId, userId),
        eq(challengeParticipants.status, "completed"),
      ),
    )
    .then((r) => r[0]?.count ?? 0)

  const allBadges = await db.select().from(badges)
  const ownedBadges = await db
    .select({ badgeId: userBadges.badgeId })
    .from(userBadges)
    .where(eq(userBadges.userId, userId))
    .then((r) => r.map((b) => b.badgeId))

  const awarded: string[] = []

  for (const badge of allBadges) {
    if (ownedBadges.includes(badge.id)) continue

    let qualifies = false
    if (badge.xpThreshold != null && userData.xpBalance >= badge.xpThreshold) {
      qualifies = true
    }
    if (
      badge.challengeThreshold != null &&
      completedChallenges >= badge.challengeThreshold
    ) {
      qualifies = true
    }

    if (qualifies) {
      await db.insert(userBadges).values({ userId, badgeId: badge.id })
      awarded.push(badge.name)
      try {
        const { createNotification, isNotifyEnabled } = await import(
          "@/lib/notifications"
        )
        if (await isNotifyEnabled("notify_badge_unlocks")) {
          await createNotification({
            userId,
            type: "badge_unlock",
            title: "Badge unlocked",
            body: `You earned: ${badge.name}`,
            href: "/gamification",
          })
        }
      } catch {
        // non-fatal
      }
    }
  }

  return awarded
}

export async function checkAndAwardBadges() {
  const userId = await getUserId()
  return checkAndAwardBadgesForUser(userId)
}
