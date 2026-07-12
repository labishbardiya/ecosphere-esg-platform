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
      {/* Video — dimmed so UI always reads */}
      <div className="absolute inset-0">
        <video
          className="h-full w-full scale-105 object-cover"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
        >
          <source src="/videos/auth-bg.mp4" type="video/mp4" />
        </video>
        {/* Strong scrims for bright sky video */}
        <div className="absolute inset-0 bg-zinc-950/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/65 to-zinc-950/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-zinc-950/40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_40%,rgba(16,185,129,0.18),transparent_55%)]" />
      </div>

      <div
        className="pointer-events-none absolute -left-16 top-1/4 size-64 rounded-full bg-emerald-500/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-1/4 size-72 rounded-full bg-teal-400/15 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 mx-auto grid min-h-svh max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-2 lg:gap-14 lg:px-8">
        {/* Left copy */}
        <section className="order-2 lg:order-1">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-white/25 bg-white/15 shadow-lg backdrop-blur-xl">
              <Leaf className="size-5 text-emerald-300" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide text-white drop-shadow">
                EcoSphere
              </p>
              <p className="text-xs text-white/70">Enterprise ESG Platform</p>
            </div>
          </div>

          <h1 className="max-w-md text-3xl font-semibold leading-[1.15] tracking-tight text-white drop-shadow-md md:text-4xl lg:text-[2.65rem]">
            Measure what matters.
            <br />
            <span className="text-emerald-300">
              Engage every employee in ESG.
            </span>
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/80 drop-shadow">
            Carbon, CSR, compliance, and gamified impact — scored live so
            leadership acts on data, not spreadsheets.
          </p>

          <ul className="mt-7 flex flex-wrap gap-2.5">
            {[
              { icon: TrendingUp, t: "Live ESG scores" },
              { icon: ShieldCheck, t: "Audit-ready trails" },
              { icon: Sparkles, t: "Badges & challenges" },
            ].map(({ icon: Icon, t }) => (
              <li
                key={t}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/30 px-3.5 py-2 text-xs font-medium text-white/90 shadow-sm backdrop-blur-xl"
              >
                <Icon className="size-3.5 text-emerald-300" />
                {t}
              </li>
            ))}
          </ul>

          {/* Compact phone */}
          <div className="mt-10 hidden sm:block">
            <div className="relative w-[210px]">
              <div className="absolute -inset-4 rounded-[2rem] bg-emerald-400/25 blur-2xl" />
              <div className="relative overflow-hidden rounded-[1.75rem] border border-white/30 bg-zinc-900/70 p-0 shadow-2xl backdrop-blur-2xl">
                <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-white/30" />
                <div className="space-y-2 p-3 pb-4">
                  <div className="flex justify-between text-[10px] text-white/60">
                    <span>ESG Mission Control</span>
                    <span className="text-emerald-300">Live</span>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-3 text-white">
                    <p className="text-[10px] text-emerald-50/90">Overall ESG</p>
                    <p className="text-2xl font-bold">71.6</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/25">
                      <div className="h-full w-[72%] rounded-full bg-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      ["Env", "72"],
                      ["Social", "68"],
                      ["Gov", "75"],
                    ].map(([l, v]) => (
                      <div
                        key={l}
                        className="rounded-lg bg-white/10 py-1.5 text-center"
                      >
                        <p className="text-[9px] text-white/55">{l}</p>
                        <p className="text-sm font-semibold text-white">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Liquid glass form — high contrast */}
        <section className="order-1 flex justify-center lg:order-2 lg:justify-end">
          <div
            className={cn(
              "relative w-full max-w-[400px] rounded-3xl border border-white/40 p-7 shadow-2xl md:p-8",
              "bg-zinc-900/55 backdrop-blur-2xl backdrop-saturate-150",
              "ring-1 ring-inset ring-white/30",
            )}
            style={{
              boxShadow:
                "0 12px 48px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.35)",
            }}
          >
            <div
              className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"
              aria-hidden
            />

            <h2 className="text-xl font-semibold tracking-tight text-white">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h2>
            <p className="mt-1.5 text-sm text-white/75">
              {isSignUp
                ? "Join your organization’s ESG workspace"
                : "Sign in to EcoSphere mission control"}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3.5">
              {isSignUp && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name" className="text-white/85">
                    Full name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                    placeholder="Jane Smith"
                    className="h-11 border-white/35 bg-black/35 text-white placeholder:text-white/45 backdrop-blur-md focus-visible:border-emerald-300/60 focus-visible:ring-emerald-400/30"
                  />
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email" className="text-white/85">
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
                  className="h-11 border-white/35 bg-black/35 text-white placeholder:text-white/45 backdrop-blur-md focus-visible:border-emerald-300/60 focus-visible:ring-emerald-400/30"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password" className="text-white/85">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  placeholder="At least 8 characters"
                  className="h-11 border-white/35 bg-black/35 text-white placeholder:text-white/45 backdrop-blur-md focus-visible:border-emerald-300/60 focus-visible:ring-emerald-400/30"
                />
              </div>
              {isSignUp && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="department" className="text-white/85">
                    Department
                  </Label>
                  <Select value={departmentId} onValueChange={setDepartmentId}>
                    <SelectTrigger
                      id="department"
                      className="h-11 w-full border-white/35 bg-black/35 text-white backdrop-blur-md data-[placeholder]:text-white/45 [&_svg]:text-white/70"
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
                  className="rounded-lg border border-red-300/40 bg-red-950/60 px-3 py-2 text-sm text-red-100"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="mt-1 h-11 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 font-medium text-white shadow-lg shadow-emerald-900/40 transition hover:from-emerald-400 hover:to-teal-400 hover:shadow-emerald-500/30 active:scale-[0.99]"
              >
                {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                {loading
                  ? "Please wait..."
                  : isSignUp
                    ? "Create account"
                    : "Sign in"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-white/70">
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
              <Link
                href={isSignUp ? "/sign-in" : "/sign-up"}
                className="font-semibold text-emerald-200 underline-offset-4 hover:text-white hover:underline"
              >
                {isSignUp ? "Sign in" : "Sign up"}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
