import Link from "next/link"
import { requireUser } from "@/lib/session"
import { getGovernanceStats } from "@/app/actions/governance"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function GovernanceOverviewPage() {
  await requireUser()
  const stats = await getGovernanceStats()

  const kpis = [
    {
      label: "Active policies",
      value: String(stats.activePolicies),
      sub: "Published for acknowledgement",
    },
    {
      label: "Pending acknowledgements",
      value: String(stats.pendingAcks),
      sub: "Across all employees",
    },
    {
      label: "Open issues",
      value: String(stats.openIssues),
      sub: `${stats.overdueIssues} overdue`,
    },
    {
      label: "Open audits",
      value: String(stats.openAudits),
      sub: "Not yet completed",
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
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compliance health</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/governance/policies">Review policies</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/governance/issues">
              Open issues ({stats.openIssues})
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/governance/audits">Audits</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
