"use server"

import { sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { getSessionUser } from "@/lib/session"

async function requireActionUser() {
  const user = await getSessionUser()
  if (!user) throw new Error("Unauthorized")
  return user
}

/** KPI cards + chart series for the environmental dashboard. */
export async function getEnvironmentalStats() {
  await requireActionUser()

  const [kpis, monthly, bySource, byDepartment, waste] = await Promise.all([
    // Current month total, previous month total
    db.execute(sql`
      SELECT
        COALESCE(SUM("totalKgCo2e") FILTER (
          WHERE date_trunc('month', "transactionDate") = date_trunc('month', CURRENT_DATE)
        ), 0)::float AS current_month,
        COALESCE(SUM("totalKgCo2e") FILTER (
          WHERE date_trunc('month', "transactionDate") = date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
        ), 0)::float AS previous_month,
        COALESCE(SUM("totalKgCo2e"), 0)::float AS all_time,
        COUNT(*)::int AS tx_count
      FROM "carbon_transactions"
    `),
    // 12-month emissions series
    db.execute(sql`
      SELECT to_char(date_trunc('month', "transactionDate"), 'YYYY-MM') AS month,
             SUM("totalKgCo2e")::float AS kg_co2e
      FROM "carbon_transactions"
      WHERE "transactionDate" >= (CURRENT_DATE - INTERVAL '12 months')
      GROUP BY 1 ORDER BY 1
    `),
    // Emissions by source type
    db.execute(sql`
      SELECT "sourceType" AS source, SUM("totalKgCo2e")::float AS kg_co2e
      FROM "carbon_transactions"
      GROUP BY 1 ORDER BY 2 DESC
    `),
    // Emissions by department
    db.execute(sql`
      SELECT d."name" AS department, SUM(ct."totalKgCo2e")::float AS kg_co2e
      FROM "carbon_transactions" ct
      JOIN "departments" d ON d."id" = ct."departmentId"
      GROUP BY 1 ORDER BY 2 DESC
    `),
    // Recycling rate (GRI 306 diversion)
    db.execute(sql`
      SELECT
        COALESCE(SUM("weightKg") FILTER (WHERE "category" IN ('recycled','organic')), 0)::float AS diverted,
        COALESCE(SUM("weightKg"), 0)::float AS total
      FROM "waste_logs"
    `),
  ])

  const k = kpis.rows[0] as {
    current_month: number
    previous_month: number
    all_time: number
    tx_count: number
  }
  const w = waste.rows[0] as { diverted: number; total: number }

  return {
    currentMonthKg: k.current_month,
    previousMonthKg: k.previous_month,
    momChangePct:
      k.previous_month > 0
        ? ((k.current_month - k.previous_month) / k.previous_month) * 100
        : null,
    allTimeKg: k.all_time,
    txCount: k.tx_count,
    recyclingRatePct: w.total > 0 ? (w.diverted / w.total) * 100 : null,
    monthlySeries: monthly.rows as { month: string; kg_co2e: number }[],
    bySource: bySource.rows as { source: string; kg_co2e: number }[],
    byDepartment: byDepartment.rows as { department: string; kg_co2e: number }[],
  }
}
