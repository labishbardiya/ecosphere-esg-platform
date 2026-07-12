import "server-only"

import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { orgSettings } from "@/lib/db/schema"

const DEFAULTS: Record<string, string> = {
  weight_environmental: "0.4",
  weight_social: "0.3",
  weight_governance: "0.3",
  require_csr_evidence: "true",
  badge_auto_award: "true",
  notify_compliance: "true",
  notify_csr_decisions: "true",
  notify_badge_unlocks: "true",
  notify_policy_reminders: "true",
}

export async function getSetting(key: string): Promise<string> {
  const row = await db
    .select()
    .from(orgSettings)
    .where(eq(orgSettings.key, key))
    .then((r) => r[0])
  return row?.value ?? DEFAULTS[key] ?? ""
}

export async function getBoolSetting(key: string): Promise<boolean> {
  return (await getSetting(key)) === "true"
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(orgSettings)
  const map = { ...DEFAULTS }
  for (const r of rows) map[r.key] = r.value
  return map
}

export async function setSetting(key: string, value: string) {
  const existing = await db
    .select()
    .from(orgSettings)
    .where(eq(orgSettings.key, key))
    .then((r) => r[0])
  if (existing) {
    await db
      .update(orgSettings)
      .set({ value, updatedAt: new Date() })
      .where(eq(orgSettings.id, existing.id))
  } else {
    await db.insert(orgSettings).values({ key, value })
  }
}

export async function getEsgWeights() {
  const e = Number(await getSetting("weight_environmental")) || 0.4
  const s = Number(await getSetting("weight_social")) || 0.3
  const g = Number(await getSetting("weight_governance")) || 0.3
  const sum = e + s + g
  if (sum <= 0) return { environmental: 0.4, social: 0.3, governance: 0.3 }
  return {
    environmental: e / sum,
    social: s / sum,
    governance: g / sum,
  }
}
