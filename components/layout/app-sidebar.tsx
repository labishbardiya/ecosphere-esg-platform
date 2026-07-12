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
    <aside className="flex h-svh w-60 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Leaf className="size-4" aria-hidden="true" />
        </div>
        <span className="text-lg font-semibold text-sidebar-foreground">
          EcoSphere
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-2">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <item.icon className="size-4" aria-hidden="true" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="mb-2 px-1">
          <p className="truncate text-sm font-medium text-sidebar-foreground">
            {userName}
          </p>
          <p className="text-xs capitalize text-sidebar-foreground/60">
            {userRole}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-sidebar-foreground/70"
          onClick={handleSignOut}
        >
          <LogOut className="size-4" aria-hidden="true" />
          Sign out
        </Button>
      </div>
    </aside>
  )
}
