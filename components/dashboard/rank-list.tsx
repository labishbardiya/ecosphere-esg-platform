"use client"

import { AnimatedNumber } from "@/components/ui/animated-number"
import { ProgressBar } from "@/components/ui/progress-bar"

export function RankList({
  items,
  max,
  unit,
}: {
  items: Array<{ id: string; label: string; value: number; sub?: string }>
  max: number
  unit?: string
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No ranking data yet.</p>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={item.id} className="space-y-1">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="min-w-0 truncate">
              <span className="mr-1.5 tabular-nums text-muted-foreground">
                #{idx + 1}
              </span>
              <span className="font-medium">{item.label}</span>
              {item.sub && (
                <span className="ml-1.5 text-xs text-muted-foreground">
                  {item.sub}
                </span>
              )}
            </span>
            <span className="shrink-0 font-semibold tabular-nums">
              <AnimatedNumber value={item.value} decimals={unit ? 0 : 1} />
              {unit ? ` ${unit}` : ""}
            </span>
          </div>
          <ProgressBar value={item.value} max={max || 100} className="h-1.5" />
        </div>
      ))}
    </div>
  )
}
