import { requireUser } from "@/lib/session"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Cloud, HeartHandshake, Shield, Trophy } from "lucide-react"

export default async function DashboardPage() {
  const user = await requireUser()

  const modules = [
    {
      icon: Cloud,
      title: "Environmental",
      description: "Carbon, energy, water and waste tracking",
      status: "Coming in Phase 2",
    },
    {
      icon: HeartHandshake,
      title: "Social",
      description: "CSR activities and employee wellbeing",
      status: "Coming in Phase 3",
    },
    {
      icon: Shield,
      title: "Governance",
      description: "Policies, compliance and audits",
      status: "Coming in Phase 3",
    },
    {
      icon: Trophy,
      title: "Gamification",
      description: "Challenges, badges and rewards",
      status: "Coming in Phase 4",
    },
  ]

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Your organization&apos;s sustainability command center.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {modules.map((m) => (
          <Card key={m.title}>
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <m.icon className="size-5" aria-hidden="true" />
              </div>
              <CardTitle>{m.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{m.description}</p>
              <p className="mt-2 text-xs font-medium text-primary">
                {m.status}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
