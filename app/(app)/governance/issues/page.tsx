import { requireUser } from "@/lib/session"
import {
  getAssignableUsers,
  getComplianceIssues,
} from "@/app/actions/governance"
import { getDepartments } from "@/app/actions/departments"
import { IssuesPanel } from "@/components/governance/gov-client"

export default async function IssuesPage() {
  const user = await requireUser()
  const [issues, users, departments] = await Promise.all([
    getComplianceIssues(),
    getAssignableUsers(),
    getDepartments(),
  ])
  const canCreate = user.role === "admin" || user.role === "manager"

  return (
    <IssuesPanel
      issues={issues}
      users={users}
      departments={departments}
      canCreate={canCreate}
    />
  )
}
