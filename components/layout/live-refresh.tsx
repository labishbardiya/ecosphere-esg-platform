"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Soft real-time: periodically revalidates the current RSC tree so admin
 * leaderboards / dashboards pick up employee actions without a full reload.
 * Interval kept short enough for demos, long enough not to thrash Neon.
 */
export function LiveRefresh({ intervalMs = 8000 }: { intervalMs?: number }) {
  const router = useRouter()

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") {
        router.refresh()
      }
    }, intervalMs)
    return () => clearInterval(id)
  }, [router, intervalMs])

  return null
}
