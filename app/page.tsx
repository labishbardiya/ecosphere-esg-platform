import Link from "next/link"
import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/session"
import { Button } from "@/components/ui/button"
import { Leaf, BarChart3, Users, Shield, Trophy } from "lucide-react"

const features = [
  {
    icon: BarChart3,
    title: "Environmental",
    description:
      "Track carbon emissions, energy, water and waste across your organization.",
  },
  {
    icon: Users,
    title: "Social",
    description:
      "Manage CSR activities, volunteering hours and employee wellbeing programs.",
  },
  {
    icon: Shield,
    title: "Governance",
    description:
      "Policies, compliance tracking, audits and anonymous whistleblower reporting.",
  },
  {
    icon: Trophy,
    title: "Gamification",
    description:
      "Eco-challenges, badges, leaderboards and green rewards to drive engagement.",
  },
]

export default async function HomePage() {
  const user = await getSessionUser()
  if (user) redirect("/dashboard")

  return (
    <main className="min-h-svh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Leaf className="size-4" aria-hidden="true" />
            </div>
            <span className="text-lg font-semibold text-foreground">
              EcoSphere
            </span>
          </div>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-foreground text-balance md:text-5xl">
          Corporate Sustainability &amp; Employee Engagement Platform
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground text-pretty leading-relaxed">
          Measure, manage and improve your organization&apos;s environmental,
          social and governance performance — while engaging every employee
          through gamified sustainability.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/sign-up">Start tracking ESG</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-lg border border-border bg-card p-6"
            >
              <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <f.icon className="size-5" aria-hidden="true" />
              </div>
              <h2 className="mt-4 font-semibold text-card-foreground">
                {f.title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
