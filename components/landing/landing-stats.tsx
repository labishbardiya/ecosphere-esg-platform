"use client"

import { AnimatedNumber } from "@/components/ui/animated-number"
import { ProgressBar } from "@/components/ui/progress-bar"

const pillars = [
  {
    label: "Environmental",
    value: 72.4,
    color: "bg-emerald-500",
    hint: "Carbon ledger + goals",
  },
  {
    label: "Social",
    value: 68.1,
    color: "bg-blue-500",
    hint: "CSR + engagement",
  },
  {
    label: "Governance",
    value: 74.8,
    color: "bg-violet-500",
    hint: "Policies + issues",
  },
]

export function LandingStats() {
  const overall = 71.6

  return (
    <div className="grid gap-6 md:grid-cols-[1.1fr_1.4fr]">
      <div className="flex flex-col justify-center rounded-xl border border-border/70 bg-background/60 p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Overall ESG score
        </p>
        <p className="mt-2 text-5xl font-bold tracking-tight text-foreground">
          <AnimatedNumber value={overall} decimals={1} />
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Weighted 40% / 30% / 30% — configurable
        </p>
        <div className="mt-4">
          <ProgressBar value={overall} barClassName="bg-gradient-to-r from-emerald-500 via-primary to-violet-500" />
        </div>
      </div>
      <div className="space-y-4">
        {pillars.map((p, i) => (
          <div
            key={p.label}
            className={`animate-fade-up stagger-${i + 2} rounded-xl border border-border/70 bg-background/50 p-4`}
          >
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">{p.label}</span>
              <span className="tabular-nums font-semibold">
                <AnimatedNumber value={p.value} decimals={1} />
              </span>
            </div>
            <ProgressBar value={p.value} barClassName={p.color} />
            <p className="mt-1.5 text-xs text-muted-foreground">{p.hint}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
