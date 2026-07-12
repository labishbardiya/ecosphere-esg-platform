"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

/** Count-up number for live-feeling KPI cards. */
export function AnimatedNumber({
  value,
  decimals = 0,
  duration = 900,
  className,
  prefix = "",
  suffix = "",
}: {
  value: number
  decimals?: number
  duration?: number
  className?: string
  prefix?: string
  suffix?: string
}) {
  const [display, setDisplay] = useState(0)
  const start = useRef<number | null>(null)
  const from = useRef(0)

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReduced) {
      setDisplay(value)
      return
    }

    from.current = display
    start.current = null
    let raf = 0
    const tick = (t: number) => {
      if (start.current == null) start.current = t
      const p = Math.min(1, (t - start.current) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(from.current + (value - from.current) * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- animate on value change only
  }, [value, duration])

  return (
    <span className={cn("tabular-nums", className)}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  )
}
