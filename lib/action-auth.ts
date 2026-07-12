import "server-only"

import type { SessionUser } from "@/lib/auth"
import { getSessionUser } from "@/lib/session"

export async function requireActionUser(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) throw new Error("Unauthorized")
  return user
}

export async function requireActionAdmin(): Promise<SessionUser> {
  const user = await requireActionUser()
  if (user.role !== "admin") throw new Error("Forbidden: admin only")
  return user
}

/** Admin or manager can approve CSR / compliance workflows. */
export async function requireActionReviewer(): Promise<SessionUser> {
  const user = await requireActionUser()
  if (user.role !== "admin" && user.role !== "manager") {
    throw new Error("Forbidden: reviewer only")
  }
  return user
}
