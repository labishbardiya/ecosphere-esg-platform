import type React from "react"
import { ModuleTabs } from "@/components/module-tabs"

const tabs = [
  { href: "/governance", label: "Overview" },
  { href: "/governance/policies", label: "Policies" },
  { href: "/governance/audits", label: "Audits" },
  { href: "/governance/issues", label: "Compliance Issues" },
]

export default function GovernanceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Governance</h1>
        <p className="text-sm text-muted-foreground">
          Policies, acknowledgements, audits, and compliance ownership
        </p>
      </div>
      <ModuleTabs tabs={tabs} ariaLabel="Governance sections" />
      {children}
    </div>
  )
}
