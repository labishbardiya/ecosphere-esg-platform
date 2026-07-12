import { getAvailableRewards, getUserRedemptions } from "@/app/actions/gamification/rewards"
import { RewardCard } from "./reward-card"

export async function RewardsTab({
  userId,
  userPoints,
}: {
  userId: string
  userPoints: number
}) {
  const [availableRewards, redemptions] = await Promise.all([
    getAvailableRewards(),
    getUserRedemptions(),
  ])

  const redeemedRewardIds = new Set(redemptions.map((r) => r.rewardPointsCost))

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Available Rewards
        </h2>
        {availableRewards.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No rewards available right now.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {availableRewards.map((reward) => (
              <RewardCard
                key={reward.id}
                reward={reward}
                userPoints={userPoints}
              />
            ))}
          </div>
        )}
      </section>

      {redemptions.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-muted-foreground">
            Your Redemptions
          </h2>
          <div className="space-y-2">
            {redemptions.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
              >
                <span className="text-sm font-medium">{r.rewardName}</span>
                <span className="text-xs text-muted-foreground">
                  Redeemed {new Date(r.redeemedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
