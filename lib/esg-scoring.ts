import "server-only"

import { and, eq, ne, sql } from "drizzle-orm"
import { unstable_cache } from "next/cache"
import { db } from "@/lib/db"
import {
  carbonTransactions,
  complianceIssues,
  csrParticipation,
  departmentScores,
  departments,
  policyAcknowledgements,
  user,
} from "@/lib/db/schema"
import { getEsgWeights } from "@/lib/org-settings"

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n))
}

function periodStart(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`
}

export type EsgScoreResult = {
  period: string
  weights: { environmental: number; social: number; governance: number }
  departments: Array<{
    departmentId: number
    name: string
    environmentalScore: number
    socialScore: number
    governanceScore: number
    totalScore: number
  }>
  organization: {
    environmental: number
    social: number
    governance: number
    total: number
  }
}

/**
 * Pure compute — no writes on the hot path.
 * Pass persist=true only for explicit recompute jobs.
 */
export async function computeDepartmentScores(options?: {
  periodMonth?: string
  persist?: boolean
}): Promise<EsgScoreResult> {
  const period = options?.periodMonth ?? periodStart()
  const persist = options?.persist ?? false
  const weights = await getEsgWeights()

  const [depts, carbonByDept, csrRows, policyRows, issueRows] =
    await Promise.all([
      db.select().from(departments),
      db
        .select({
          departmentId: carbonTransactions.departmentId,
          total: sql<string>`coalesce(sum(${carbonTransactions.totalKgCo2e}::numeric), 0)`,
        })
        .from(carbonTransactions)
        .groupBy(carbonTransactions.departmentId),
      db
        .select({
          departmentId: user.departmentId,
          status: csrParticipation.status,
          cnt: sql<string>`count(*)`,
        })
        .from(csrParticipation)
        .innerJoin(user, eq(csrParticipation.userId, user.id))
        .groupBy(user.departmentId, csrParticipation.status),
      db
        .select({
          departmentId: user.departmentId,
          status: policyAcknowledgements.status,
          cnt: sql<string>`count(*)`,
        })
        .from(policyAcknowledgements)
        .innerJoin(user, eq(policyAcknowledgements.userId, user.id))
        .groupBy(user.departmentId, policyAcknowledgements.status),
      db
        .select({
          departmentId: complianceIssues.departmentId,
          open: sql<string>`count(*) filter (where ${complianceIssues.status} not in ('resolved','closed'))`,
          overdue: sql<string>`count(*) filter (where ${complianceIssues.status} not in ('resolved','closed') and ${complianceIssues.dueDate}::date < current_date)`,
        })
        .from(complianceIssues)
        .groupBy(complianceIssues.departmentId),
    ])

  const carbonMap = new Map(
    carbonByDept.map((r) => [r.departmentId, Number(r.total)]),
  )
  const maxCarbon = Math.max(1, ...Array.from(carbonMap.values()), 1)

  function csrForDept(deptId: number) {
    let total = 0
    let approved = 0
    for (const r of csrRows) {
      if (r.departmentId !== deptId) continue
      const c = Number(r.cnt)
      total += c
      if (r.status === "approved") approved += c
    }
    return { total, approved }
  }

  function policyForDept(deptId: number) {
    let total = 0
    let accepted = 0
    for (const r of policyRows) {
      if (r.departmentId !== deptId) continue
      const c = Number(r.cnt)
      total += c
      if (r.status === "accepted") accepted += c
    }
    return { total, accepted }
  }

  const results: EsgScoreResult["departments"] = []

  for (const dept of depts) {
    const kg = carbonMap.get(dept.id) ?? 0
    const envScore = clamp(100 - (kg / maxCarbon) * 80)

    const social = csrForDept(dept.id)
    const approvalRate =
      social.total > 0 ? (social.approved / social.total) * 100 : 50
    const volumeBonus = clamp(social.approved * 5, 0, 30)
    const socialScore = clamp(approvalRate * 0.7 + volumeBonus)

    const pol = policyForDept(dept.id)
    const ackRate = pol.total > 0 ? (pol.accepted / pol.total) * 100 : 70
    const issues = issueRows.find((i) => i.departmentId === dept.id)
    const openIssues = Number(issues?.open ?? 0)
    const overdue = Number(issues?.overdue ?? 0)
    const govScore = clamp(ackRate - openIssues * 5 - overdue * 10)

    const totalScore = clamp(
      envScore * weights.environmental +
        socialScore * weights.social +
        govScore * weights.governance,
    )

    results.push({
      departmentId: dept.id,
      name: dept.name,
      environmentalScore: Number(envScore.toFixed(2)),
      socialScore: Number(socialScore.toFixed(2)),
      governanceScore: Number(govScore.toFixed(2)),
      totalScore: Number(totalScore.toFixed(2)),
    })
  }

  if (persist && results.length > 0) {
    await Promise.all(
      results.map(async (row) => {
        const existing = await db
          .select({ id: departmentScores.id })
          .from(departmentScores)
          .where(eq(departmentScores.departmentId, row.departmentId))
          .then((r) => r[0])

        const payload = {
          environmentalScore: row.environmentalScore.toFixed(2),
          socialScore: row.socialScore.toFixed(2),
          governanceScore: row.governanceScore.toFixed(2),
          totalScore: row.totalScore.toFixed(2),
          computedAt: new Date(),
          periodMonth: period,
        }

        if (existing) {
          await db
            .update(departmentScores)
            .set(payload)
            .where(eq(departmentScores.id, existing.id))
        } else {
          await db.insert(departmentScores).values({
            departmentId: row.departmentId,
            ...payload,
          })
        }
      }),
    )
  }

  const avg = (fn: (r: (typeof results)[0]) => number) =>
    results.length === 0
      ? 0
      : Number(
          (results.reduce((a, r) => a + fn(r), 0) / results.length).toFixed(2),
        )

  return {
    period,
    weights,
    departments: results.sort((a, b) => b.totalScore - a.totalScore),
    organization: {
      environmental: avg((r) => r.environmentalScore),
      social: avg((r) => r.socialScore),
      governance: avg((r) => r.governanceScore),
      total: avg((r) => r.totalScore),
    },
  }
}

/** Short cache so live refresh still picks up new activity quickly. */
export const getLatestScores = unstable_cache(
  async () => computeDepartmentScores({ persist: false }),
  ["esg-scores-v3"],
  { revalidate: 8, tags: ["esg-scores"] },
)

export async function recomputeAndPersistScores() {
  return computeDepartmentScores({ persist: true })
}
