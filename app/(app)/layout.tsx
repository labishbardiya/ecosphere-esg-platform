import { requireUser } from "@/lib/session"
import { AppSidebar } from "@/components/layout/app-sidebar"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireUser()

  return (
    <div className="flex min-h-svh bg-background">
      <AppSidebar userName={user.name} userRole={user.role} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
