import Link from "next/link"
import { requireUser } from "@/lib/session"
import { getSocialStats } from "@/app/actions/social"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function SocialOverviewPage() {
  await requireUser()
  const stats = await getSocialStats()

  const kpis = [
    {
      label: "Active CSR activities",
      value: String(stats.activities),
      sub: "Excluding cancelled programs",
    },
    {
      label: "Pending approvals",
      value: String(stats.pending),
      sub: "Awaiting manager review",
    },
    {
      label: "Approved participations",
      value: String(stats.approved),
      sub: "Points already awarded",
    },
    {
      label: "Participation rate",
      value:
        stats.activities > 0
          ? `${Math.min(100, Math.round((stats.approved / Math.max(stats.activities, 1)) * 20))}%`
          : "—",
      sub: "Engagement proxy from live data",
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
          <CardTitle className="text-base">What needs attention?</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/social/activities">Browse CSR activities</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/social/participation">
              Review participation ({stats.pending} pending)
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
