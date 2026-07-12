import type React from "react"
import { ModuleTabs } from "@/components/module-tabs"

const tabs = [
  { href: "/social", label: "Overview" },
  { href: "/social/activities", label: "CSR Activities" },
  { href: "/social/participation", label: "Participation" },
]

export default function SocialLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Social</h1>
        <p className="text-sm text-muted-foreground">
          CSR programs, employee participation, and engagement metrics
        </p>
      </div>
      <ModuleTabs tabs={tabs} ariaLabel="Social sections" />
      {children}
    </div>
  )
}
