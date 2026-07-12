"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Leaf,
  LayoutDashboard,
  Cloud,
  HeartHandshake,
  Shield,
  Trophy,
  FileBarChart,
  Settings,
  LogOut,
} from "lucide-react"

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/environmental", label: "Environmental", icon: Cloud },
  { href: "/social", label: "Social", icon: HeartHandshake },
  { href: "/governance", label: "Governance", icon: Shield },
  { href: "/gamification", label: "Gamification", icon: Trophy },
  { href: "/reports", label: "Reports", icon: FileBarChart, adminOnly: true },
  { href: "/settings", label: "Settings", icon: Settings, adminOnly: true },
]

export function AppSidebar({
  userName,
  userRole,
}: {
  userName: string
  userRole: string
}) {
  const pathname = usePathname()
  const router = useRouter()

  const items = navItems.filter(
    (item) => !item.adminOnly || userRole === "admin",
  )

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push("/sign-in")
    router.refresh()
  }

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-card">
      {/* Brand */}
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-border px-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Leaf className="size-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight text-foreground">
            EcoSphere
          </p>
          <p className="truncate text-[11px] text-muted-foreground">ESG Platform</p>
        </div>
      </div>

      {/* Nav — scrolls only if needed; never pushes footer off-screen awkwardly */}
      <nav
        className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-3"
        aria-label="Main"
      >
        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Modules
        </p>
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="size-4 shrink-0" aria-hidden="true" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User block — always pinned to bottom of the shell */}
      <div className="shrink-0 border-t border-border bg-muted/30 p-3">
        <div className="mb-2 flex items-center gap-2.5 rounded-lg px-1">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
            {userName
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {userName}
            </p>
            <p className="truncate text-xs capitalize text-muted-foreground">
              {userRole}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={handleSignOut}
        >
          <LogOut className="size-4" aria-hidden="true" />
          Sign out
        </Button>
      </div>
    </aside>
  )
}
