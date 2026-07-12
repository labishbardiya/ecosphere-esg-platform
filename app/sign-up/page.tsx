import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/session"
import { getDepartments } from "@/app/actions/departments"
import { AuthForm } from "@/components/auth/auth-form"

export default async function SignUpPage() {
  const user = await getSessionUser()
  if (user) redirect("/dashboard")
  const departments = await getDepartments()
  return <AuthForm mode="sign-up" departments={departments} />
}
