import { getGoals } from "@/app/actions/environmental"
import { getDepartments } from "@/app/actions/departments"
import { requireUser } from "@/lib/session"
import { GoalsView } from "@/components/environmental/goals-view"

export default async function GoalsPage() {
  const user = await requireUser()
  const [goals, departments] = await Promise.all([getGoals(), getDepartments()])

  return (
    <GoalsView
      goals={goals.map((g) => ({
        id: g.id,
        title: g.title,
        metric: g.metric,
        targetValue: Number(g.targetValue),
        unit: g.unit,
        baselineValue: g.baselineValue != null ? Number(g.baselineValue) : null,
        departmentId: g.departmentId,
        startDate: g.startDate,
        endDate: g.endDate,
        status: g.status,
      }))}
      departments={departments}
      isAdmin={user.role === "admin"}
    />
  )
}
