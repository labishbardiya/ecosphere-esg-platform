"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const tabs = [
  { href: "/environmental", label: "Overview" },
  { href: "/environmental/transactions", label: "Carbon Ledger" },
  { href: "/environmental/resources", label: "Resources" },
  { href: "/environmental/waste", label: "Waste" },
  { href: "/environmental/goals", label: "Goals" },
  { href: "/environmental/factors", label: "Emission Factors" },
]

export function EnvTabs() {
  const pathname = usePathname()
  return (
    <nav
      aria-label="Environmental sections"
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
