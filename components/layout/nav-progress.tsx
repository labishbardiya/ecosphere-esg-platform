"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

/** Thin top progress bar so module clicks feel instant while RSC loads. */
export function NavProgress() {
  const pathname = usePathname()
  const [active, setActive] = useState(false)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    // Path changed → finish bar quickly
    setWidth(100)
    const t = setTimeout(() => {
      setActive(false)
      setWidth(0)
    }, 280)
    return () => clearTimeout(t)
  }, [pathname])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a")
      if (!a) return
      const href = a.getAttribute("href")
      if (!href || href.startsWith("http") || href.startsWith("#")) return
      if (href === pathname) return
      // Internal nav starting
      setActive(true)
      setWidth(18)
      const t1 = setTimeout(() => setWidth(55), 80)
      const t2 = setTimeout(() => setWidth(78), 220)
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
      }
    }
    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
  }, [pathname])

  if (!active && width === 0) return null

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 bg-transparent"
    >
      <div
        className="h-full bg-primary shadow-[0_0_8px_var(--primary)] transition-[width] duration-200 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  )
}
