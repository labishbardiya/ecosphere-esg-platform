import { getAllBadges, getUserBadges, checkAndAwardBadges } from "@/app/actions/gamification/badges"
import { BadgeCard } from "./badge-card"

export async function BadgesTab({ userId }: { userId: string }) {
  await checkAndAwardBadges().catch(() => {})

  const [allBadges, userBadges] = await Promise.all([
    getAllBadges(),
    getUserBadges(),
  ])

  const ownedBadgeIds = new Set(userBadges.map((b) => b.badgeId))

  const earned = allBadges.filter((b) => ownedBadgeIds.has(b.id))
  const locked = allBadges.filter((b) => !ownedBadgeIds.has(b.id))

  const earnedBadgeMeta = new Map(
    userBadges.map((b) => [b.badgeId, b.earnedAt]),
  )

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Earned Badges ({earned.length}/{allBadges.length})
        </h2>
        {earned.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Complete challenges and earn XP to unlock badges.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {earned.map((badge) => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                earned={earnedBadgeMeta.get(badge.id)!}
              />
            ))}
          </div>
        )}
      </section>

      {locked.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-muted-foreground">
            Locked Badges
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {locked.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
