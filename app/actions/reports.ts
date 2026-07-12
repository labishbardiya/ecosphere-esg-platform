"use server"

import { and, desc, eq, gte, lte, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import {
  carbonTransactions,
  complianceIssues,
  csrActivities,
  csrParticipation,
  departments,
  policies,
  policyAcknowledgements,
  user,
} from "@/lib/db/schema"
import { requireActionUser } from "@/lib/action-auth"
import { computeDepartmentScores } from "@/lib/esg-scoring"

export type ReportFilters = {
  departmentId?: number
  dateFrom?: string
  dateTo?: string
  module?: "environmental" | "social" | "governance" | "summary"
}

export async function getEnvironmentalReport(filters: ReportFilters = {}) {
  await requireActionUser()
  const conditions = []
  if (filters.departmentId) {
    conditions.push(eq(carbonTransactions.departmentId, filters.departmentId))
  }
  if (filters.dateFrom) {
    conditions.push(gte(carbonTransactions.transactionDate, filters.dateFrom))
  }
  if (filters.dateTo) {
    conditions.push(lte(carbonTransactions.transactionDate, filters.dateTo))
  }

  const rows = await db
    .select({
      id: carbonTransactions.id,
      description: carbonTransactions.description,
      activityType: carbonTransactions.activityType,
      sourceType: carbonTransactions.sourceType,
      quantity: carbonTransactions.quantity,
      unit: carbonTransactions.unit,
      totalKgCo2e: carbonTransactions.totalKgCo2e,
      transactionDate: carbonTransactions.transactionDate,
      departmentId: carbonTransactions.departmentId,
      departmentName: departments.name,
    })
    .from(carbonTransactions)
    .leftJoin(
      departments,
      eq(carbonTransactions.departmentId, departments.id),
    )
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(carbonTransactions.transactionDate))
    .limit(500)

  const totalKg = rows.reduce((a, r) => a + Number(r.totalKgCo2e), 0)
  return { rows, totalKg, count: rows.length }
}

export async function getSocialReport(filters: ReportFilters = {}) {
  await requireActionUser()
  const rows = await db
    .select({
      id: csrParticipation.id,
      status: csrParticipation.status,
      pointsEarned: csrParticipation.pointsEarned,
      userName: user.name,
      departmentId: user.departmentId,
      departmentName: departments.name,
      activityTitle: csrActivities.title,
      completedAt: csrParticipation.completedAt,
    })
    .from(csrParticipation)
    .innerJoin(user, eq(csrParticipation.userId, user.id))
    .innerJoin(
      csrActivities,
      eq(csrParticipation.activityId, csrActivities.id),
    )
    .leftJoin(departments, eq(user.departmentId, departments.id))
    .where(
      filters.departmentId
        ? eq(user.departmentId, filters.departmentId)
        : undefined,
    )
    .orderBy(desc(csrParticipation.createdAt))
    .limit(500)

  return {
    rows,
    approved: rows.filter((r) => r.status === "approved").length,
    pending: rows.filter((r) => r.status === "pending").length,
    totalPoints: rows.reduce((a, r) => a + (r.pointsEarned ?? 0), 0),
  }
}

export async function getGovernanceReport(filters: ReportFilters = {}) {
  await requireActionUser()
  const issues = await db
    .select({
      id: complianceIssues.id,
      title: complianceIssues.title,
      severity: complianceIssues.severity,
      status: complianceIssues.status,
      dueDate: complianceIssues.dueDate,
      ownerName: user.name,
      departmentName: departments.name,
    })
    .from(complianceIssues)
    .leftJoin(user, eq(complianceIssues.ownerId, user.id))
    .leftJoin(departments, eq(complianceIssues.departmentId, departments.id))
    .where(
      filters.departmentId
        ? eq(complianceIssues.departmentId, filters.departmentId)
        : undefined,
    )
    .orderBy(desc(complianceIssues.createdAt))
    .limit(500)

  const acks = await db
    .select({
      status: policyAcknowledgements.status,
      c: sql<string>`count(*)`,
    })
    .from(policyAcknowledgements)
    .groupBy(policyAcknowledgements.status)

  const policyList = await db
    .select({
      id: policies.id,
      title: policies.title,
      version: policies.version,
      status: policies.status,
    })
    .from(policies)
    .orderBy(desc(policies.createdAt))
    .limit(100)

  return { issues, acknowledgements: acks, policies: policyList }
}

export async function getEsgSummaryReport() {
  await requireActionUser()
  const scores = await computeDepartmentScores()
  const env = await getEnvironmentalReport()
  const social = await getSocialReport()
  const gov = await getGovernanceReport()
  return {
    scores,
    environmental: { totalKg: env.totalKg, transactions: env.count },
    social: {
      approved: social.approved,
      pending: social.pending,
      totalPoints: social.totalPoints,
    },
    governance: {
      openIssues: gov.issues.filter(
        (i) => i.status !== "resolved" && i.status !== "closed",
      ).length,
      overdue: gov.issues.filter(
        (i) =>
          i.status !== "resolved" &&
          i.status !== "closed" &&
          i.dueDate < new Date().toISOString().slice(0, 10),
      ).length,
      policies: gov.policies.length,
    },
  }
}

/** Build CSV string for browser download. */
export async function exportReportCsv(
  module: "environmental" | "social" | "governance" | "summary",
  filters: ReportFilters = {},
): Promise<{ filename: string; csv: string }> {
  await requireActionUser()

  if (module === "environmental") {
    const { rows } = await getEnvironmentalReport(filters)
    const header =
      "id,date,department,source,activity,description,quantity,unit,kg_co2e"
    const lines = rows.map(
      (r) =>
        `${r.id},${r.transactionDate},${csvEscape(r.departmentName)},${csvEscape(r.sourceType)},${csvEscape(r.activityType)},${csvEscape(r.description)},${r.quantity},${r.unit},${r.totalKgCo2e}`,
    )
    return {
      filename: `environmental-report-${Date.now()}.csv`,
      csv: [header, ...lines].join("\n"),
    }
  }

  if (module === "social") {
    const { rows } = await getSocialReport(filters)
    const header =
      "id,activity,user,department,status,points,completed_at"
    const lines = rows.map(
      (r) =>
        `${r.id},${csvEscape(r.activityTitle)},${csvEscape(r.userName)},${csvEscape(r.departmentName)},${r.status},${r.pointsEarned},${r.completedAt?.toISOString() ?? ""}`,
    )
    return {
      filename: `social-report-${Date.now()}.csv`,
      csv: [header, ...lines].join("\n"),
    }
  }

  if (module === "governance") {
    const { issues } = await getGovernanceReport(filters)
    const header = "id,title,severity,status,due_date,owner,department"
    const lines = issues.map(
      (r) =>
        `${r.id},${csvEscape(r.title)},${r.severity},${r.status},${r.dueDate},${csvEscape(r.ownerName)},${csvEscape(r.departmentName)}`,
    )
    return {
      filename: `governance-report-${Date.now()}.csv`,
      csv: [header, ...lines].join("\n"),
    }
  }

  const summary = await getEsgSummaryReport()
  const header =
    "department,environmental,social,governance,total"
  const lines = summary.scores.departments.map(
    (d) =>
      `${csvEscape(d.name)},${d.environmentalScore},${d.socialScore},${d.governanceScore},${d.totalScore}`,
  )
  lines.push(
    `ORGANIZATION,${summary.scores.organization.environmental},${summary.scores.organization.social},${summary.scores.organization.governance},${summary.scores.organization.total}`,
  )
  return {
    filename: `esg-summary-${Date.now()}.csv`,
    csv: [header, ...lines].join("\n"),
  }
}

function csvEscape(v: string | null | undefined) {
  const s = v ?? ""
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}
