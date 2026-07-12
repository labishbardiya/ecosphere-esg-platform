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
import { Leaf, ShieldCheck, Sparkles, TrendingUp } from "lucide-react"

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
      {/* Full-bleed background video */}
      <div className="absolute inset-0">
        <video
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster=""
          aria-hidden
        >
          <source src="/videos/auth-bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/95 via-zinc-950/80 to-emerald-950/50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.18),transparent_50%)]" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-svh max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-2 lg:gap-16 lg:px-8">
        {/* Left: brand + two-line essence + phone mockup */}
        <section className="order-2 flex flex-col justify-center lg:order-1">
          <div className="mb-6 flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
              <Leaf className="size-5" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide text-white">
                EcoSphere
              </p>
              <p className="text-xs text-white/60">Enterprise ESG Platform</p>
            </div>
          </div>

          {/* Two free lines — product essence */}
          <h1 className="max-w-md text-3xl font-semibold leading-tight tracking-tight text-white md:text-4xl">
            Measure what matters.
            <br />
            <span className="text-emerald-300">
              Engage every employee in ESG.
            </span>
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/70">
            Carbon, CSR, compliance, and gamified impact — scored live so
            leadership acts on data, not spreadsheets.
          </p>

          <ul className="mt-6 flex flex-wrap gap-3 text-xs text-white/70">
            <li className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur">
              <TrendingUp className="size-3.5 text-emerald-400" />
              Live ESG scores
            </li>
            <li className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur">
              <ShieldCheck className="size-3.5 text-emerald-400" />
              Audit-ready trails
            </li>
            <li className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur">
              <Sparkles className="size-3.5 text-emerald-400" />
              Badges & challenges
            </li>
          </ul>

          {/* Phone mockup — product preview */}
          <div className="mt-10 hidden justify-start sm:flex">
            <div className="relative w-[220px] shrink-0">
              <div className="absolute -inset-3 rounded-[2.2rem] bg-emerald-400/20 blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] border-[6px] border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/50">
                <div className="mx-auto mt-2 h-1.5 w-16 rounded-full bg-zinc-700" />
                <div className="space-y-3 p-3 pb-5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-medium text-zinc-400">
                      ESG Mission Control
                    </p>
                    <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-300">
                      Live
                    </span>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 p-3 text-white">
                    <p className="text-[10px] text-emerald-100">Overall ESG</p>
                    <p className="text-2xl font-bold tabular-nums">71.6</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/20">
                      <div className="h-full w-[72%] rounded-full bg-white/90" />
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
                        className="rounded-lg bg-zinc-800/80 px-1.5 py-2 text-center"
                      >
                        <p className="text-[9px] text-zinc-400">{x.l}</p>
                        <p className="text-sm font-semibold text-white">
                          {x.v}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-2">
                    <p className="text-[9px] font-medium text-zinc-400">
                      Top insight
                    </p>
                    <p className="mt-0.5 text-[10px] leading-snug text-zinc-200">
                      Facilities leads ranking. 2 issues overdue.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right: glass auth card */}
        <section className="order-1 flex justify-center lg:order-2 lg:justify-end">
          <div className="w-full max-w-[400px] rounded-2xl border border-white/10 bg-white/95 p-6 text-zinc-900 shadow-2xl backdrop-blur-xl md:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold tracking-tight">
                {isSignUp ? "Create your account" : "Welcome back"}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                {isSignUp
                  ? "Join your organization’s ESG workspace"
                  : "Sign in to EcoSphere mission control"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {isSignUp && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                    placeholder="Jane Smith"
                    className="h-10"
                  />
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Work email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="jane@company.com"
                  className="h-10"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  placeholder="At least 8 characters"
                  className="h-10"
                />
              </div>
              {isSignUp && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="department">Department</Label>
                  <Select value={departmentId} onValueChange={setDepartmentId}>
                    <SelectTrigger id="department" className="h-10 w-full">
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
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="mt-1 h-10 w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {loading
                  ? "Please wait..."
                  : isSignUp
                    ? "Create account"
                    : "Sign in"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-zinc-500">
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
              <Link
                href={isSignUp ? "/sign-in" : "/sign-up"}
                className="font-medium text-emerald-700 underline-offset-4 hover:underline"
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
