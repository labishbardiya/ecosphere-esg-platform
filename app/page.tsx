import Link from "next/link"
import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/session"
import { Button } from "@/components/ui/button"
import { Leaf, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react"
import { LandingStats } from "@/components/landing/landing-stats"
import { LandingModules } from "@/components/landing/landing-modules"

export default async function HomePage() {
  const user = await getSessionUser()
  if (user) redirect("/dashboard")

  return (
    <main className="relative min-h-svh overflow-hidden mesh-bg">
      {/* Newsletter-style animated gradient orbs + grid */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="orb orb-a" />
        <div className="orb orb-b" />
        <div className="orb orb-c" />
        <div className="absolute inset-0 grid-overlay opacity-70" />
      </div>

      <header className="relative z-10 border-b border-border/60 bg-background/50 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2 animate-fade-in">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30">
              <Leaf className="size-4" aria-hidden="true" />
            </div>
            <div>
              <span className="block text-lg font-semibold leading-none text-foreground">
                EcoSphere
              </span>
              <span className="text-[11px] text-muted-foreground">
                Enterprise ESG Platform
              </span>
            </div>
          </div>
          <nav className="flex items-center gap-2 animate-fade-in stagger-2">
            <Button variant="ghost" asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild className="shadow-md shadow-primary/20">
              <Link href="/sign-up">
                Get started
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-12 pt-16 md:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" />
            Measure · Engage · Report — audit-ready ESG
          </div>
          <h1 className="animate-fade-up stagger-2 mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-foreground text-balance md:text-6xl md:leading-[1.08]">
            Turn ESG from a{" "}
            <span className="bg-gradient-to-r from-primary via-emerald-600 to-teal-600 bg-clip-text text-transparent">
              compliance chore
            </span>{" "}
            into workforce engagement
          </h1>
          <p className="animate-fade-up stagger-3 mx-auto mt-5 max-w-2xl text-lg text-muted-foreground text-pretty leading-relaxed">
            Carbon accounting, CSR participation, governance compliance, and
            gamified employee engagement — one ERP-style platform with live
            department scores.
          </p>
          <div className="animate-fade-up stagger-4 mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild className="h-11 px-6 shadow-lg shadow-primary/25">
              <Link href="/sign-up">Start tracking ESG</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-11 bg-background/60 backdrop-blur">
              <Link href="/sign-in">Sign in to demo</Link>
            </Button>
          </div>
          <ul className="animate-fade-up stagger-5 mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {[
              "Live ESG scoring (40/30/30)",
              "Proof-based CSR approvals",
              "Auto badge unlocks",
            ].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-primary" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Floating product preview card */}
        <div className="animate-fade-up stagger-6 relative mx-auto mt-14 max-w-4xl">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/30 via-teal-400/20 to-blue-400/20 blur-lg" />
          <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/90 p-5 shadow-2xl backdrop-blur-md md:p-8">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Organization ESG health
                </p>
                <p className="text-sm text-muted-foreground">
                  Computed from live operational data
                </p>
              </div>
              <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary animate-pulse-soft">
                Live scoring
              </div>
            </div>
            <LandingStats />
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-24">
        <div className="mb-8 text-center animate-fade-up">
          <h2 className="text-2xl font-semibold tracking-tight">
            Four modules. One decision center.
          </h2>
          <p className="mt-2 text-muted-foreground">
            Built for sustainability managers, department heads, and every employee.
          </p>
        </div>
        <LandingModules />
      </section>

      <footer className="relative z-10 border-t border-border/60 bg-background/40 py-8 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <Leaf className="size-4 text-primary" />
            EcoSphere — Enterprise ESG Management
          </div>
          <p>Environmental · Social · Governance · Gamification</p>
        </div>
      </footer>
    </main>
  )
}
