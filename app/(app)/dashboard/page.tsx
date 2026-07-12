import Link from "next/link"
import { getDashboardData } from "@/app/actions/dashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  KpiScoreCard,
  KpiStatCard,
} from "@/components/dashboard/kpi-score-card"
import { RankList } from "@/components/dashboard/rank-list"

export default async function DashboardPage() {
  const data = await getDashboardData()
  const { scores, envStats, social, governance, insights } = data

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-6 md:px-8 md:py-8">
      <header className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
            Welcome, {data.user.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground">
            Mission control — live ESG health from operational data
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/reports">Reports</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/environmental/transactions">Log carbon</Link>
          </Button>
        </div>
      </header>

      {/* Score row */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          ESG scores
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiScoreCard
            label="Overall ESG"
            value={scores.organization.total}
            href="/reports"
            barClassName="bg-gradient-to-r from-emerald-500 via-primary to-violet-500"
          />
          <KpiScoreCard
            label="Environmental"
            value={scores.organization.environmental}
            href="/environmental"
            accent="text-emerald-700 dark:text-emerald-400"
            barClassName="bg-emerald-500"
          />
          <KpiScoreCard
            label="Social"
            value={scores.organization.social}
            href="/social"
            accent="text-blue-700 dark:text-blue-400"
            barClassName="bg-blue-500"
          />
          <KpiScoreCard
            label="Governance"
            value={scores.organization.governance}
            href="/governance"
            accent="text-purple-700 dark:text-purple-400"
            barClassName="bg-violet-500"
          />
        </div>
      </section>

      {/* Ops metrics */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          This period
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiStatCard
            label="Carbon this month"
            value={envStats.currentMonthKg}
            decimals={1}
            suffix="kg"
            sub={
              envStats.momChangePct != null
                ? `${envStats.momChangePct >= 0 ? "+" : ""}${envStats.momChangePct.toFixed(1)}% MoM`
                : "No prior month"
            }
          />
          <KpiStatCard
            label="CSR pending"
            value={social.pending}
            sub={`${social.approved} approved total`}
          />
          <KpiStatCard
            label="Open compliance"
            value={governance.openIssues}
            sub={`${governance.overdueIssues} overdue`}
            valueClassName={
              governance.overdueIssues > 0 ? "text-destructive" : undefined
            }
          />
          <KpiStatCard
            label="Your points"
            value={data.user.pointsBalance}
            sub={`${data.user.xpBalance} XP · ${data.user.role}`}
          />
        </div>
      </section>

      {/* Insights + rankings */}
      <section className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick insights</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {insights.map((i) => (
                <li
                  key={i}
                  className="rounded-lg border border-border/80 bg-muted/40 px-3 py-2.5 text-sm leading-snug"
                >
                  {i}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Department ranking</CardTitle>
          </CardHeader>
          <CardContent>
            <RankList
              items={scores.departments.slice(0, 6).map((d) => ({
                id: String(d.departmentId),
                label: d.name,
                value: d.totalScore,
              }))}
              max={100}
            />
          </CardContent>
        </Card>
      </section>

      {/* Deadlines + activity */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Upcoming deadlines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {data.upcomingDeadlines.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No open compliance deadlines.
              </p>
            )}
            {data.upcomingDeadlines.map((d) => {
              const overdue =
                d.dueDate < new Date().toISOString().slice(0, 10)
              return (
                <div
                  key={d.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2 text-sm"
                >
                  <span className="min-w-0 truncate font-medium">{d.title}</span>
                  <Badge
                    variant={overdue ? "destructive" : "secondary"}
                    className="shrink-0"
                  >
                    {d.dueDate}
                  </Badge>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 text-sm">
            {data.recentCarbon.slice(0, 3).map((c) => (
              <div
                key={`c-${c.id}`}
                className="flex justify-between gap-3 border-b border-border/50 pb-2 last:border-0 last:pb-0"
              >
                <span className="min-w-0 truncate text-muted-foreground">
                  Carbon · {c.description}
                </span>
                <span className="shrink-0 tabular-nums font-medium">
                  {Number(c.totalKgCo2e).toFixed(1)} kg
                </span>
              </div>
            ))}
            {data.recentCsr.slice(0, 2).map((c) => (
              <div
                key={`s-${c.id}`}
                className="flex justify-between gap-3 border-b border-border/50 pb-2 last:border-0 last:pb-0"
              >
                <span className="min-w-0 truncate text-muted-foreground">
                  CSR · {c.title}
                </span>
                <span className="shrink-0 capitalize">{c.status}</span>
              </div>
            ))}
            {data.recentNotifs.slice(0, 3).map((n) => (
              <div
                key={`n-${n.id}`}
                className="flex items-center justify-between gap-3 border-b border-border/50 pb-2 last:border-0 last:pb-0"
              >
                <span className="min-w-0 truncate">{n.title}</span>
                {!n.isRead && (
                  <Badge className="shrink-0" variant="default">
                    new
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Engagement leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <RankList
            items={data.topUsers.map((u) => ({
              id: u.id,
              label: u.name,
              value: u.xpBalance,
              sub: `${u.pointsBalance} pts`,
            }))}
            max={Math.max(...data.topUsers.map((u) => u.xpBalance), 100)}
            unit="XP"
          />
        </CardContent>
      </Card>
    </div>
  )
}
