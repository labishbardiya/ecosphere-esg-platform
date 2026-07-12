import type React from "react"
import { EnvTabs } from "@/components/environmental/env-tabs"

export default function EnvironmentalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Environmental</h1>
        <p className="text-sm text-muted-foreground">
          Carbon accounting, resource usage, waste and reduction goals (GHG
          Protocol / GRI 302-306)
        </p>
      </div>
      <EnvTabs />
      {children}
    </div>
  )
}
