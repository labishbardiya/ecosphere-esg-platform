import { requireAdmin } from "@/lib/session"
import {
  getEsgSummaryReport,
  getEnvironmentalReport,
  getSocialReport,
  getGovernanceReport,
} from "@/app/actions/reports"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ReportExportButtons } from "@/components/reports/export-buttons"

export default async function ReportsPage() {
  await requireAdmin()
  const [summary, env, social, gov] = await Promise.all([
    getEsgSummaryReport(),
    getEnvironmentalReport(),
    getSocialReport(),
    getGovernanceReport(),
  ])

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Live ESG reports with CSV export — filters applied server-side
          </p>
        </div>
        <ReportExportButtons />
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Overall ESG
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {summary.scores.organization.total}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Environmental
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {summary.scores.organization.environmental}
            </p>
            <p className="text-xs text-muted-foreground">
              {env.totalKg.toFixed(1)} kg CO2e · {env.count} txs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Social
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {summary.scores.organization.social}
            </p>
            <p className="text-xs text-muted-foreground">
              {social.approved} approved · {social.pending} pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Governance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {summary.scores.organization.governance}
            </p>
            <p className="text-xs text-muted-foreground">
              {summary.governance.openIssues} open issues ·{" "}
              {summary.governance.overdue} overdue
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Department rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Department</th>
                  <th className="py-2 pr-4 font-medium">Env</th>
                  <th className="py-2 pr-4 font-medium">Social</th>
                  <th className="py-2 pr-4 font-medium">Gov</th>
                  <th className="py-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {summary.scores.departments.map((d) => (
                  <tr key={d.departmentId} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{d.name}</td>
                    <td className="py-2 pr-4">{d.environmentalScore}</td>
                    <td className="py-2 pr-4">{d.socialScore}</td>
                    <td className="py-2 pr-4">{d.governanceScore}</td>
                    <td className="py-2 font-semibold">{d.totalScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Carbon transactions (sample)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {env.rows.slice(0, 8).map((r) => (
              <div
                key={r.id}
                className="flex justify-between gap-2 border-b py-2 last:border-0"
              >
                <span className="truncate">{r.description}</span>
                <span className="shrink-0 text-muted-foreground">
                  {Number(r.totalKgCo2e).toFixed(1)} kg
                </span>
              </div>
            ))}
            {env.rows.length === 0 && (
              <p className="text-muted-foreground">No carbon data yet.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compliance issues</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {gov.issues.slice(0, 8).map((i) => (
              <div
                key={i.id}
                className="flex justify-between gap-2 border-b py-2 last:border-0"
              >
                <span className="truncate">{i.title}</span>
                <span className="shrink-0 text-muted-foreground">
                  {i.severity} · {i.status}
                </span>
              </div>
            ))}
            {gov.issues.length === 0 && (
              <p className="text-muted-foreground">No issues logged.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
