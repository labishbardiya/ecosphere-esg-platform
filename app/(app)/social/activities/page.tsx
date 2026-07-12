import { requireUser } from "@/lib/session"
import {
  getCsrActivities,
  getCsrCategories,
  getMyCsrParticipations,
} from "@/app/actions/social"
import {
  ActivityList,
  CreateCsrForm,
} from "@/components/social/csr-client"

export default async function SocialActivitiesPage() {
  const user = await requireUser()
  const [activities, categories, mine] = await Promise.all([
    getCsrActivities(),
    getCsrCategories(),
    getMyCsrParticipations(),
  ])
  const canCreate = user.role === "admin" || user.role === "manager"

  return (
    <div className="flex flex-col gap-6">
      <CreateCsrForm categories={categories} canCreate={canCreate} />
      <ActivityList
        activities={activities}
        myJoinedIds={mine.map((m) => m.activityId)}
      />
    </div>
  )
}
