"use server"

import { desc, eq, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import {
  carbonTransactions,
  challenges,
  complianceIssues,
  csrActivities,
  notifications,
  user,
} from "@/lib/db/schema"
import { requireActionUser } from "@/lib/action-auth"
import { computeDepartmentScores } from "@/lib/esg-scoring"
import { getEnvironmentalStats } from "@/app/actions/environmental-stats"
import { getSocialStats } from "@/app/actions/social"
import { getGovernanceStats } from "@/app/actions/governance"

export async function getDashboardData() {
  const actor = await requireActionUser()
  const [scores, envStats, social, governance, recentNotifs] =
    await Promise.all([
      computeDepartmentScores(),
      getEnvironmentalStats(),
      getSocialStats(),
      getGovernanceStats(),
      db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, actor.id))
        .orderBy(desc(notifications.createdAt))
        .limit(8),
    ])

  const insights: string[] = []
  if (envStats.momChangePct != null && envStats.momChangePct > 5) {
    insights.push(
      `Emissions rose ${envStats.momChangePct.toFixed(1)}% vs last month.`,
    )
  } else if (envStats.momChangePct != null && envStats.momChangePct < -5) {
    insights.push(
      `Emissions fell ${Math.abs(envStats.momChangePct).toFixed(1)}% vs last month.`,
    )
  }
  if (governance.overdueIssues > 0) {
    insights.push(
      `${governance.overdueIssues} compliance issue(s) are overdue.`,
    )
  }
  if (social.pending > 0) {
    insights.push(`${social.pending} CSR participation(s) await approval.`)
  }
  if (scores.departments[0]) {
    insights.push(
      `${scores.departments[0].name} leads ESG ranking (${scores.departments[0].totalScore}).`,
    )
  }
  if (scores.departments.length > 1) {
    const worst = scores.departments[scores.departments.length - 1]
    insights.push(
      `${worst.name} has the lowest ESG score (${worst.totalScore}) — needs attention.`,
    )
  }
  if (insights.length === 0) {
    insights.push("No critical alerts. Keep logging ESG activity.")
  }

  const upcomingDeadlines = await db
    .select({
      id: complianceIssues.id,
      title: complianceIssues.title,
      dueDate: complianceIssues.dueDate,
      severity: complianceIssues.severity,
      status: complianceIssues.status,
    })
    .from(complianceIssues)
    .where(
      sql`${complianceIssues.status} not in ('resolved','closed')`,
    )
    .orderBy(complianceIssues.dueDate)
    .limit(6)

  const activeChallenges = await db
    .select({
      id: challenges.id,
      title: challenges.title,
      endDate: challenges.endDate,
      xpReward: challenges.xpReward,
    })
    .from(challenges)
    .where(eq(challenges.isActive, true))
    .orderBy(challenges.endDate)
    .limit(5)

  const recentCarbon = await db
    .select({
      id: carbonTransactions.id,
      description: carbonTransactions.description,
      totalKgCo2e: carbonTransactions.totalKgCo2e,
      transactionDate: carbonTransactions.transactionDate,
    })
    .from(carbonTransactions)
    .orderBy(desc(carbonTransactions.createdAt))
    .limit(5)

  const recentCsr = await db
    .select({
      id: csrActivities.id,
      title: csrActivities.title,
      status: csrActivities.status,
      pointsReward: csrActivities.pointsReward,
    })
    .from(csrActivities)
    .orderBy(desc(csrActivities.createdAt))
    .limit(5)

  const topUsers = await db
    .select({
      id: user.id,
      name: user.name,
      xpBalance: user.xpBalance,
      pointsBalance: user.pointsBalance,
    })
    .from(user)
    .orderBy(desc(user.xpBalance))
    .limit(5)

  return {
    user: actor,
    scores,
    envStats,
    social,
    governance,
    insights,
    upcomingDeadlines,
    activeChallenges,
    recentCarbon,
    recentCsr,
    recentNotifs,
    topUsers,
  }
}
