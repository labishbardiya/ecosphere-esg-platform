import "server-only"

import { and, eq, ne, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import {
  carbonTransactions,
  complianceIssues,
  csrParticipation,
  departmentScores,
  departments,
  policies,
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

/**
 * Deterministic ESG scoring from live operational data.
 */
export async function computeDepartmentScores(periodMonth?: string) {
  const period = periodMonth ?? periodStart()
  const weights = await getEsgWeights()
  const depts = await db.select().from(departments)

  const carbonByDept = await db
    .select({
      departmentId: carbonTransactions.departmentId,
      total: sql<string>`coalesce(sum(${carbonTransactions.totalKgCo2e}::numeric), 0)`,
    })
    .from(carbonTransactions)
    .groupBy(carbonTransactions.departmentId)

  const carbonMap = new Map(
    carbonByDept.map((r) => [r.departmentId, Number(r.total)]),
  )
  const maxCarbon = Math.max(1, ...Array.from(carbonMap.values()), 1)

  const csrRows = await db
    .select({
      departmentId: user.departmentId,
      status: csrParticipation.status,
      cnt: sql<string>`count(*)`,
    })
    .from(csrParticipation)
    .innerJoin(user, eq(csrParticipation.userId, user.id))
    .groupBy(user.departmentId, csrParticipation.status)

  const policyRows = await db
    .select({
      departmentId: user.departmentId,
      status: policyAcknowledgements.status,
      cnt: sql<string>`count(*)`,
    })
    .from(policyAcknowledgements)
    .innerJoin(user, eq(policyAcknowledgements.userId, user.id))
    .groupBy(user.departmentId, policyAcknowledgements.status)

  const issueRows = await db
    .select({
      departmentId: complianceIssues.departmentId,
      open: sql<string>`count(*) filter (where ${complianceIssues.status} not in ('resolved','closed'))`,
      overdue: sql<string>`count(*) filter (where ${complianceIssues.status} not in ('resolved','closed') and ${complianceIssues.dueDate}::date < current_date)`,
    })
    .from(complianceIssues)
    .groupBy(complianceIssues.departmentId)

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

  const results: Array<{
    departmentId: number
    name: string
    environmentalScore: number
    socialScore: number
    governanceScore: number
    totalScore: number
  }> = []

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

    const existing = await db
      .select()
      .from(departmentScores)
      .where(
        and(
          eq(departmentScores.departmentId, dept.id),
          eq(departmentScores.periodMonth, period),
        ),
      )
      .then((r) => r[0])

    const payload = {
      environmentalScore: envScore.toFixed(2),
      socialScore: socialScore.toFixed(2),
      governanceScore: govScore.toFixed(2),
      totalScore: totalScore.toFixed(2),
      computedAt: new Date(),
    }

    if (existing) {
      await db
        .update(departmentScores)
        .set(payload)
        .where(eq(departmentScores.id, existing.id))
    } else {
      await db.insert(departmentScores).values({
        departmentId: dept.id,
        periodMonth: period,
        ...payload,
      })
    }
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

export async function getLatestScores() {
  return computeDepartmentScores()
}
