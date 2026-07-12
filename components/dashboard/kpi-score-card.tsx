"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AnimatedNumber } from "@/components/ui/animated-number"
import { ProgressBar } from "@/components/ui/progress-bar"
import { cn } from "@/lib/utils"

export function KpiScoreCard({
  label,
  value,
  href,
  accent,
  barClassName,
}: {
  label: string
  value: number
  href: string
  accent?: string
  barClassName?: string
  delayClass?: string
}) {
  return (
    <Link
      href={href}
      className="group block rounded-xl outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="h-full gap-0 border-border/80 py-0 shadow-sm transition-all duration-200 group-hover:border-emerald-200 group-hover:shadow-md">
        <CardHeader className="px-5 pb-1 pt-4">
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-5 pb-4">
          <p
            className={cn(
              "text-3xl font-semibold tabular-nums tracking-tight text-foreground",
              accent,
            )}
          >
            <AnimatedNumber value={value} decimals={1} />
          </p>
          <ProgressBar
            value={value}
            className="h-2 bg-zinc-100"
            barClassName={cn("bg-emerald-600", barClassName)}
          />
          <p className="text-[11px] text-muted-foreground">
            Click to open module →
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}

export function KpiStatCard({
  label,
  value,
  decimals = 0,
  suffix,
  sub,
  valueClassName,
}: {
  label: string
  value: number
  decimals?: number
  suffix?: string
  sub?: string
  delayClass?: string
  valueClassName?: string
}) {
  return (
    <Card className="h-full gap-0 border-border/80 py-0 shadow-sm">
      <CardHeader className="px-5 pb-1 pt-4">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        <p
          className={cn(
            "text-3xl font-semibold tabular-nums tracking-tight",
            valueClassName,
          )}
        >
          <AnimatedNumber
            value={value}
            decimals={decimals}
            suffix={suffix ? ` ${suffix}` : ""}
          />
        </p>
        {sub && (
          <p className="mt-1.5 text-xs leading-snug text-muted-foreground">
            {sub}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
