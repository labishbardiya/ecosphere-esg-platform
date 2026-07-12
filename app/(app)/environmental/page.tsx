import { getEnvironmentalStats } from "@/app/actions/environmental-stats"
import { requireUser } from "@/lib/session"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EnvCharts } from "@/components/environmental/env-charts"

function formatKg(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(2)} t`
  return `${kg.toFixed(1)} kg`
}

export default async function EnvironmentalOverviewPage() {
  await requireUser()
  const stats = await getEnvironmentalStats()

  const kpis = [
    {
      label: "Emissions this month",
      value: `${formatKg(stats.currentMonthKg)} CO2e`,
      sub:
        stats.momChangePct != null
          ? `${stats.momChangePct >= 0 ? "+" : ""}${stats.momChangePct.toFixed(1)}% vs last month`
          : "No prior month data",
    },
    {
      label: "All-time emissions",
      value: `${formatKg(stats.allTimeKg)} CO2e`,
      sub: `${stats.txCount} transactions recorded`,
    },
    {
      label: "Recycling rate",
      value:
        stats.recyclingRatePct != null
          ? `${stats.recyclingRatePct.toFixed(1)}%`
          : "—",
      sub: "Diverted (recycled + organic) / total waste",
    },
    {
      label: "Top emitting dept",
      value: stats.byDepartment[0]?.department ?? "—",
      sub: stats.byDepartment[0]
        ? `${formatKg(stats.byDepartment[0].kg_co2e)} CO2e`
        : "No data yet",
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{kpi.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <EnvCharts
        monthlySeries={stats.monthlySeries}
        bySource={stats.bySource}
        byDepartment={stats.byDepartment}
      />
    </div>
  )
}
