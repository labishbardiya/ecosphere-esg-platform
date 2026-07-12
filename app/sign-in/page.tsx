import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/session"
import { AuthForm } from "@/components/auth/auth-form"

export const dynamic = "force-dynamic"

export default async function SignInPage() {
  const user = await getSessionUser()
  if (user) redirect("/dashboard")
  return <AuthForm mode="sign-in" />
}
