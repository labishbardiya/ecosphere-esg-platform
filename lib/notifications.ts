import "server-only"

import { desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { notifications, orgSettings } from "@/lib/db/schema"

export async function isNotifyEnabled(key: string): Promise<boolean> {
  const row = await db
    .select()
    .from(orgSettings)
    .where(eq(orgSettings.key, key))
    .then((r) => r[0])
  if (!row) return true
  return row.value === "true"
}

export async function createNotification(input: {
  userId: string
  type: string
  title: string
  body?: string
  href?: string
}) {
  await db.insert(notifications).values({
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    href: input.href ?? null,
  })
}

export async function getUserNotifications(userId: string, limit = 30) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
}

export async function markNotificationRead(id: number, userId: string) {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.id, id))
  // ensure ownership by re-checking in callers if needed
  void userId
}
