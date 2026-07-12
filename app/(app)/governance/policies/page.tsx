import { requireUser } from "@/lib/session"
import { getMyPolicyAcks } from "@/app/actions/governance"
import {
  CreatePolicyForm,
  PolicyAckList,
} from "@/components/governance/gov-client"

export default async function PoliciesPage() {
  const user = await requireUser()
  const acks = await getMyPolicyAcks()
  return (
    <div className="flex flex-col gap-6">
      <CreatePolicyForm canCreate={user.role === "admin"} />
      <PolicyAckList items={acks} />
    </div>
  )
}
