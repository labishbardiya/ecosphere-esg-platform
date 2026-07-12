import { getWasteLogs } from "@/app/actions/environmental"
import { getDepartments } from "@/app/actions/departments"
import { requireUser } from "@/lib/session"
import { WasteView } from "@/components/environmental/waste-view"

export default async function WastePage() {
  const user = await requireUser()
  const [logs, departments] = await Promise.all([
    getWasteLogs(),
    getDepartments(),
  ])

  return (
    <WasteView
      logs={logs.map((l) => ({
        id: l.id,
        category: l.category,
        weightKg: Number(l.weightKg),
        departmentId: l.departmentId,
        logDate: l.logDate,
        notes: l.notes,
      }))}
      departments={departments}
      defaultDepartmentId={user.departmentId}
    />
  )
}
