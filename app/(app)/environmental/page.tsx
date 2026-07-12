import { getEnvironmentalStats } from "@/app/actions/environmental-stats"
import { requireUser } from "@/lib/session"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EnvCharts } from "@/components/environmental/env-charts"
import { ProgressBar } from "@/components/ui/progress-bar"
import { cn } from "@/lib/utils"

function formatKg(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(2)} t`
  return `${kg.toFixed(1)} kg`
}

export default async function EnvironmentalOverviewPage() {
  await requireUser()
  const stats = await getEnvironmentalStats()

  const mom = stats.momChangePct
  const kpis = [
    {
      label: "Emissions this month",
      value: `${formatKg(stats.currentMonthKg)} CO₂e`,
      sub:
        mom != null
          ? `${mom >= 0 ? "+" : ""}${mom.toFixed(1)}% vs last month`
          : "No prior month data",
      tone: mom != null && mom > 0 ? "bad" : mom != null && mom < 0 ? "good" : "neutral",
      bar: null as number | null,
    },
    {
      label: "All-time emissions",
      value: `${formatKg(stats.allTimeKg)} CO₂e`,
      sub: `${stats.txCount} transactions recorded`,
      tone: "neutral",
      bar: null,
    },
    {
      label: "Recycling rate",
      value:
        stats.recyclingRatePct != null
          ? `${stats.recyclingRatePct.toFixed(1)}%`
          : "—",
      sub: "Diverted (recycled + organic) / total waste",
      tone: "good",
      bar: stats.recyclingRatePct,
    },
    {
      label: "Top emitting dept",
      value: stats.byDepartment[0]?.department ?? "—",
      sub: stats.byDepartment[0]
        ? `${formatKg(stats.byDepartment[0].kg_co2e)} CO₂e`
        : "No data yet",
      tone: "neutral",
      bar: null,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card
            key={kpi.label}
            className="gap-0 border-border/80 py-0 shadow-sm transition-shadow hover:shadow-md"
          >
            <CardHeader className="px-5 pb-1 pt-4">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {kpi.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 px-5 pb-4">
              <p className="text-2xl font-semibold tracking-tight tabular-nums">
                {kpi.value}
              </p>
              {kpi.bar != null && (
                <ProgressBar
                  value={kpi.bar}
                  barClassName="bg-emerald-600"
                  className="h-1.5 bg-zinc-100"
                />
              )}
              <p
                className={cn(
                  "text-xs leading-snug",
                  kpi.tone === "good" && "text-emerald-600",
                  kpi.tone === "bad" && "text-red-600",
                  kpi.tone === "neutral" && "text-muted-foreground",
                )}
              >
                {kpi.sub}
              </p>
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
