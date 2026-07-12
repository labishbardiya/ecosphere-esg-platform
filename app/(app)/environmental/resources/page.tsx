import { getResourceUsage } from "@/app/actions/environmental"
import { getDepartments } from "@/app/actions/departments"
import { requireUser } from "@/lib/session"
import { ResourcesView } from "@/components/environmental/resources-view"

export default async function ResourcesPage() {
  const user = await requireUser()
  const [usage, departments] = await Promise.all([
    getResourceUsage(),
    getDepartments(),
  ])

  return (
    <ResourcesView
      usage={usage.map((u) => ({
        id: u.id,
        resourceType: u.resourceType,
        quantity: Number(u.quantity),
        unit: u.unit,
        departmentId: u.departmentId,
        periodMonth: u.periodMonth,
        notes: u.notes,
      }))}
      departments={departments}
      defaultDepartmentId={user.departmentId}
    />
  )
}
