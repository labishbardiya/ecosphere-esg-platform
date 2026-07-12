import { requireUser } from "@/lib/session"
import { getAudits } from "@/app/actions/governance"
import { getDepartments } from "@/app/actions/departments"
import { AuditsPanel } from "@/components/governance/gov-client"

export default async function AuditsPage() {
  const user = await requireUser()
  const [audits, departments] = await Promise.all([
    getAudits(),
    getDepartments(),
  ])
  const canCreate = user.role === "admin" || user.role === "manager"

  return (
    <AuditsPanel
      audits={audits}
      departments={departments}
      canCreate={canCreate}
    />
  )
}
