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
    <Link href={href} className="block rounded-xl transition-shadow hover:shadow-md">
      <Card className="h-full shadow-none">
        <CardHeader className="pb-1.5 pt-4">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            {label}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5 pb-4">
          <p className={cn("text-2xl font-semibold tabular-nums tracking-tight", accent)}>
            <AnimatedNumber value={value} decimals={1} />
          </p>
          <ProgressBar value={value} barClassName={barClassName} />
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
    <Card className="h-full shadow-none">
      <CardHeader className="pb-1.5 pt-4">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <p
          className={cn(
            "text-2xl font-semibold tabular-nums tracking-tight",
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
          <p className="mt-1 text-xs text-muted-foreground leading-snug">{sub}</p>
        )}
      </CardContent>
    </Card>
  )
}
