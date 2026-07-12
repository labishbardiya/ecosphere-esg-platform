import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/session"
import { getDepartments } from "@/app/actions/departments"
import { AuthForm } from "@/components/auth/auth-form"

export const dynamic = "force-dynamic"

export default async function SignUpPage() {
  const user = await getSessionUser()
  if (user) redirect("/dashboard")
  let departments: { id: number; name: string }[] = []
  try {
    departments = await getDepartments()
  } catch {
    departments = []
  }
  return <AuthForm mode="sign-up" departments={departments} />
}
