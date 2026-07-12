"use client"

import { cn } from "@/lib/utils"

export function ProgressBar({
  value,
  max = 100,
  className,
  barClassName,
}: {
  value: number
  max?: number
  className?: string
  barClassName?: string
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800",
        className,
      )}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          "h-full rounded-full bg-emerald-600 transition-[width] duration-500 ease-out",
          barClassName,
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
