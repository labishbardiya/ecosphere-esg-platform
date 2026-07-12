import { requireUser } from "@/lib/session"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { NavProgress } from "@/components/layout/nav-progress"
import { LiveRefresh } from "@/components/layout/live-refresh"

// Auth-gated shell must never be statically prerendered at build time.
export const dynamic = "force-dynamic"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireUser()

  // Fixed viewport shell: sidebar stays; only main content scrolls/swaps.
  return (
    <div className="flex h-svh overflow-hidden bg-muted/40">
      <NavProgress />
      {/* Soft real-time: employee actions appear for admin ~every 8s */}
      <LiveRefresh intervalMs={8000} />
      <AppSidebar userName={user.name} userRole={user.role} />
      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="min-h-full bg-background">{children}</div>
      </main>
    </div>
  )
}
