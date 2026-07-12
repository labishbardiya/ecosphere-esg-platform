import { getLeaderboardWithMeta } from "@/app/actions/gamification/leaderboard"
import { LeaderboardTable } from "./leaderboard-table"

export async function LeaderboardTab({ userId }: { userId: string }) {
  const entries = await getLeaderboardWithMeta(50)

  return (
    <div>
      <LeaderboardTable entries={entries} currentUserId={userId} />
    </div>
  )
}
