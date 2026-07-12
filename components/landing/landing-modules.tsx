"use client"

import { BarChart3, Users, Shield, Trophy } from "lucide-react"

const modules = [
  {
    icon: BarChart3,
    title: "Environmental",
    description:
      "Emission factors, auto-calc carbon ledger, resources, waste, and reduction goals.",
    accent: "from-emerald-500/15 to-transparent",
    iconBg: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  },
  {
    icon: Users,
    title: "Social",
    description:
      "CSR activities with proof upload, manager approval, and points into the engagement loop.",
    accent: "from-blue-500/15 to-transparent",
    iconBg: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  },
  {
    icon: Shield,
    title: "Governance",
    description:
      "Versioned policies, acknowledgements, audits, and owned compliance issues with due dates.",
    accent: "from-violet-500/15 to-transparent",
    iconBg: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  },
  {
    icon: Trophy,
    title: "Gamification",
    description:
      "Challenges, XP, auto-awarded badges, redeemable rewards, and live leaderboards.",
    accent: "from-amber-500/15 to-transparent",
    iconBg: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  },
]

export function LandingModules() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {modules.map((m, i) => (
        <div
          key={m.title}
          className={`card-hover animate-fade-up stagger-${i + 1} group relative overflow-hidden rounded-xl border border-border/80 bg-card/80 p-6 backdrop-blur-sm`}
        >
          <div
            className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${m.accent} opacity-80`}
          />
          <div className="relative">
            <div
              className={`flex size-11 items-center justify-center rounded-xl ${m.iconBg} transition-transform duration-300 group-hover:scale-110`}
            >
              <m.icon className="size-5" aria-hidden="true" />
            </div>
            <h3 className="mt-4 font-semibold text-card-foreground">
              {m.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {m.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
