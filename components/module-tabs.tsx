"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function ModuleTabs({
  tabs,
  ariaLabel,
}: {
  tabs: { href: string; label: string }[]
  ariaLabel: string
}) {
  const pathname = usePathname()
  return (
    <nav
      aria-label={ariaLabel}
      className="flex flex-wrap gap-1 border-b border-border"
    >
      {tabs.map((tab) => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
