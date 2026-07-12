import { getActiveChallenges, getPastChallenges, getUserChallengeStatus } from "@/app/actions/gamification/challenges"
import { ChallengeCard } from "./challenge-card"

export async function ChallengesTab({ userId }: { userId: string }) {
  const [activeChallenges, pastChallenges, userStatuses] = await Promise.all([
    getActiveChallenges(),
    getPastChallenges(),
    getUserChallengeStatus().catch(() => []),
  ])

  const statusMap = new Map(
    userStatuses.map((s) => [s.challengeId, s]),
  )

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Active Challenges
        </h2>
        {activeChallenges.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No active challenges right now. Check back soon!
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                userStatus={statusMap.get(challenge.id)?.status ?? null}
              />
            ))}
          </div>
        )}
      </section>

      {pastChallenges.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Past Challenges
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pastChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                userStatus={statusMap.get(challenge.id)?.status ?? null}
                past
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
