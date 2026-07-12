"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Leaf, Loader2, ShieldCheck, Sparkles, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

type Department = { id: number; name: string }

const glassPanel =
  "relative overflow-hidden rounded-[1.75rem] border border-white/25 bg-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-2xl backdrop-saturate-150"

const glassInput =
  "h-11 border-white/25 bg-white/15 text-white placeholder:text-white/45 shadow-inner shadow-black/10 backdrop-blur-md focus-visible:border-white/50 focus-visible:ring-white/30 data-[placeholder]:text-white/45 [&_svg]:text-white/70"

export function AuthForm({
  mode,
  departments = [],
}: {
  mode: "sign-in" | "sign-up"
  departments?: Department[]
}) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [departmentId, setDepartmentId] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isSignUp = mode === "sign-up"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (isSignUp && !departmentId) {
      setError("Please select your department")
      return
    }

    setLoading(true)

    const { error } = isSignUp
      ? await authClient.signUp.email({
          email,
          password,
          name,
          departmentId: Number(departmentId),
        })
      : await authClient.signIn.email({ email, password })

    setLoading(false)

    if (error) {
      setError(error.message ?? "Something went wrong")
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <main className="relative min-h-svh overflow-hidden bg-zinc-950 text-white">
      {/* Background video — user Desktop/background.mp4 */}
      <div className="absolute inset-0">
        <video
          className="h-full w-full scale-105 object-cover opacity-90"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
        >
          <source src="/videos/auth-bg.mp4" type="video/mp4" />
        </video>
        {/* Transparency layers over video */}
        <div className="absolute inset-0 bg-zinc-950/45" />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/50 via-transparent to-cyan-950/40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(16,185,129,0.22),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(34,211,238,0.15),transparent_50%)]" />
      </div>

      {/* Floating liquid orbs */}
      <div
        className="pointer-events-none absolute -left-20 top-1/4 size-72 rounded-full bg-emerald-400/25 blur-3xl animate-liquid-float"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-1/4 size-80 rounded-full bg-cyan-400/20 blur-3xl animate-liquid-float-delayed"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/3 top-10 size-40 rounded-full bg-white/10 blur-2xl animate-liquid-pulse"
        aria-hidden
      />

      <div className="relative z-10 mx-auto grid min-h-svh max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-2 lg:gap-14 lg:px-8">
        {/* Brand + phone */}
        <section className="order-2 animate-auth-rise lg:order-1">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-white/30 bg-white/15 shadow-lg shadow-emerald-500/20 backdrop-blur-xl transition-transform duration-500 hover:scale-105">
              <Leaf className="size-5 text-emerald-300" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide text-white">
                EcoSphere
              </p>
              <p className="text-xs text-white/55">Enterprise ESG Platform</p>
            </div>
          </div>

          <h1 className="max-w-md text-3xl font-semibold leading-[1.15] tracking-tight text-white md:text-4xl lg:text-[2.6rem]">
            Measure what matters.
            <br />
            <span className="bg-gradient-to-r from-emerald-200 via-teal-200 to-cyan-200 bg-clip-text text-transparent">
              Engage every employee in ESG.
            </span>
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/65">
            Carbon, CSR, compliance, and gamified impact — scored live so
            leadership acts on data, not spreadsheets.
          </p>

          <ul className="mt-7 flex flex-wrap gap-2.5">
            {[
              { icon: TrendingUp, t: "Live ESG scores" },
              { icon: ShieldCheck, t: "Audit-ready trails" },
              { icon: Sparkles, t: "Badges & challenges" },
            ].map(({ icon: Icon, t }, i) => (
              <li
                key={t}
                className={cn(
                  glassPanel,
                  "inline-flex items-center gap-1.5 px-3.5 py-2 text-xs text-white/80 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/15",
                  i === 1 && "animate-auth-rise-delay-1",
                  i === 2 && "animate-auth-rise-delay-2",
                )}
              >
                <Icon className="size-3.5 text-emerald-300" />
                {t}
              </li>
            ))}
          </ul>

          {/* Glass phone mockup */}
          <div className="mt-12 hidden sm:block animate-auth-rise-delay-2">
            <div className="relative w-[230px]">
              <div className="absolute -inset-6 rounded-[2.5rem] bg-emerald-400/20 blur-3xl animate-liquid-pulse" />
              <div
                className={cn(
                  glassPanel,
                  "rounded-[2rem] border-[5px] border-white/20 p-0 transition-transform duration-700 hover:-translate-y-1 hover:rotate-1",
                )}
              >
                <div className="mx-auto mt-2.5 h-1.5 w-14 rounded-full bg-white/25" />
                <div className="space-y-2.5 p-3 pb-5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-medium text-white/55">
                      ESG Mission Control
                    </p>
                    <span className="rounded-full border border-emerald-300/30 bg-emerald-400/20 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-100">
                      Live
                    </span>
                  </div>
                  <div className="rounded-2xl border border-white/15 bg-gradient-to-br from-emerald-500/40 to-teal-600/50 p-3 backdrop-blur-md">
                    <p className="text-[10px] text-emerald-50/80">Overall ESG</p>
                    <p className="text-2xl font-bold tabular-nums text-white">
                      71.6
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/25">
                      <div className="h-full w-[72%] rounded-full bg-white/90 animate-bar-shimmer" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { l: "Env", v: "72" },
                      { l: "Social", v: "68" },
                      { l: "Gov", v: "75" },
                    ].map((x) => (
                      <div
                        key={x.l}
                        className="rounded-xl border border-white/10 bg-white/10 px-1.5 py-2 text-center backdrop-blur-sm"
                      >
                        <p className="text-[9px] text-white/50">{x.l}</p>
                        <p className="text-sm font-semibold text-white">{x.v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/10 p-2 backdrop-blur-sm">
                    <p className="text-[9px] font-medium text-white/50">
                      Top insight
                    </p>
                    <p className="mt-0.5 text-[10px] leading-snug text-white/85">
                      Facilities leads ranking. 2 issues overdue.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Liquid glass form */}
        <section className="order-1 flex justify-center animate-auth-rise-delay-1 lg:order-2 lg:justify-end">
          <div className={cn(glassPanel, "w-full max-w-[420px] p-7 md:p-8")}>
            {/* Specular highlight */}
            <div
              className="pointer-events-none absolute -left-1/4 -top-1/3 h-1/2 w-[150%] rotate-[-8deg] bg-gradient-to-b from-white/25 to-transparent opacity-60"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 rounded-[1.75rem] ring-1 ring-inset ring-white/20"
              aria-hidden
            />

            <div className="relative">
              <h2 className="text-xl font-semibold tracking-tight text-white">
                {isSignUp ? "Create your account" : "Welcome back"}
              </h2>
              <p className="mt-1.5 text-sm text-white/55">
                {isSignUp
                  ? "Join your organization’s ESG workspace"
                  : "Sign in to EcoSphere mission control"}
              </p>

              <form
                onSubmit={handleSubmit}
                className="mt-7 flex flex-col gap-4"
              >
                {isSignUp && (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="name" className="text-white/75">
                      Full name
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoComplete="name"
                      placeholder="Jane Smith"
                      className={glassInput}
                    />
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email" className="text-white/75">
                    Work email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="jane@company.com"
                    className={glassInput}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password" className="text-white/75">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete={
                      isSignUp ? "new-password" : "current-password"
                    }
                    placeholder="At least 8 characters"
                    className={glassInput}
                  />
                </div>
                {isSignUp && (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="department" className="text-white/75">
                      Department
                    </Label>
                    <Select
                      value={departmentId}
                      onValueChange={setDepartmentId}
                    >
                      <SelectTrigger
                        id="department"
                        className={cn(glassInput, "w-full")}
                      >
                        <SelectValue placeholder="Select your department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={String(d.id)}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {error && (
                  <p
                    className="rounded-lg border border-red-400/30 bg-red-500/15 px-3 py-2 text-sm text-red-100"
                    role="alert"
                  >
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="group relative mt-1 h-11 w-full overflow-hidden rounded-xl border border-white/20 bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-emerald-400/40 active:scale-[0.98]"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <span className="relative inline-flex items-center gap-2">
                    {loading && <Loader2 className="size-4 animate-spin" />}
                    {loading
                      ? "Please wait..."
                      : isSignUp
                        ? "Create account"
                        : "Sign in"}
                  </span>
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-white/55">
                {isSignUp
                  ? "Already have an account? "
                  : "Don't have an account? "}
                <Link
                  href={isSignUp ? "/sign-in" : "/sign-up"}
                  className="font-medium text-emerald-200 underline-offset-4 transition-colors hover:text-white hover:underline"
                >
                  {isSignUp ? "Sign in" : "Sign up"}
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
