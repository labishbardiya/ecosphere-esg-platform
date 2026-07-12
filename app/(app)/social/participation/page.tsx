import { requireUser } from "@/lib/session"
import {
  getMyCsrParticipations,
  getPendingCsrReviews,
} from "@/app/actions/social"
import { ParticipationPanel } from "@/components/social/csr-client"

export default async function SocialParticipationPage() {
  const user = await requireUser()
  const canReview = user.role === "admin" || user.role === "manager"
  const mine = await getMyCsrParticipations()
  const pendingReviews = canReview ? await getPendingCsrReviews() : []

  return (
    <ParticipationPanel
      mine={mine}
      pendingReviews={pendingReviews}
      canReview={canReview}
    />
  )
}
