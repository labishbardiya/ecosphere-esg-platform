import type React from "react"
import { EnvTabs } from "@/components/environmental/env-tabs"

export default function EnvironmentalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-6 py-6 md:px-8 md:py-8">
      <header className="border-b border-border pb-5">
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
          Environmental
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Carbon accounting, resources, waste &amp; goals · GHG Protocol / GRI
          302–306
        </p>
      </header>
      <EnvTabs />
      {children}
    </div>
  )
}
