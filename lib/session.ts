import "server-only"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth, type SessionUser } from "@/lib/auth"

/**
 * Returns the current session user or null.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return null
    const u = session.user as unknown as SessionUser
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role ?? "employee",
      departmentId: u.departmentId ?? null,
      xpBalance: u.xpBalance ?? 0,
      pointsBalance: u.pointsBalance ?? 0,
    }
  } catch {
    // DB/auth outage must not white-screen public pages
    return null
  }
}

/**
 * Requires an authenticated user; redirects to /sign-in otherwise.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) redirect("/sign-in")
  return user
}

/**
 * Requires an authenticated admin; redirects non-admins to the dashboard.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser()
  if (user.role !== "admin") redirect("/dashboard")
  return user
}

/**
 * For server actions: returns the user id or throws.
 */
export async function getUserId(): Promise<string> {
  const user = await getSessionUser()
  if (!user) throw new Error("Unauthorized")
  return user.id
}
