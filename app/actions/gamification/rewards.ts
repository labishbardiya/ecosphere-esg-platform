"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { rewards, rewardRedemptions, user } from "@/lib/db/schema"
import { getUserId } from "@/lib/session"
import { eq, and, desc, sql } from "drizzle-orm"

export async function getAvailableRewards() {
  return db
    .select()
    .from(rewards)
    .where(
      and(
        eq(rewards.isActive, true),
        sql`${rewards.stock} > 0`,
      ),
    )
    .orderBy(rewards.pointsCost)
}

export async function getAllRewards() {
  return db.select().from(rewards).orderBy(rewards.pointsCost)
}

export async function redeemReward(rewardId: number) {
  const userId = await getUserId()

  const reward = await db
    .select()
    .from(rewards)
    .where(eq(rewards.id, rewardId))
    .then((r) => r[0])

  if (!reward) return { error: "Reward not found" }
  if (reward.stock <= 0) return { error: "Out of stock" }

  const userData = await db
    .select({ pointsBalance: user.pointsBalance })
    .from(user)
    .where(eq(user.id, userId))
    .then((r) => r[0])

  if (!userData || userData.pointsBalance < reward.pointsCost) {
    return { error: "Insufficient points" }
  }

  await db.transaction(async (tx) => {
    await tx
      .update(user)
      .set({
        pointsBalance: sql`${user.pointsBalance} - ${reward.pointsCost}`,
      })
      .where(eq(user.id, userId))

    await tx
      .update(rewards)
      .set({
        stock: sql`${rewards.stock} - 1`,
      })
      .where(eq(rewards.id, rewardId))

    await tx.insert(rewardRedemptions).values({
      rewardId,
      userId,
    })
  })

  revalidatePath("/dashboard")
  revalidatePath("/gamification")
  return { success: true }
}

export async function getUserRedemptions() {
  const userId = await getUserId()
  return db
    .select({
      id: rewardRedemptions.id,
      redeemedAt: rewardRedemptions.redeemedAt,
      rewardName: rewards.name,
      rewardPointsCost: rewards.pointsCost,
    })
    .from(rewardRedemptions)
    .innerJoin(rewards, eq(rewardRedemptions.rewardId, rewards.id))
    .where(eq(rewardRedemptions.userId, userId))
    .orderBy(desc(rewardRedemptions.redeemedAt))
}
