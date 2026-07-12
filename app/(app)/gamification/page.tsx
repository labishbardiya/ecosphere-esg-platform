import { requireUser } from "@/lib/session"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChallengesTab } from "./_components/challenges-tab"
import { BadgesTab } from "./_components/badges-tab"
import { LeaderboardTab } from "./_components/leaderboard-tab"
import { RewardsTab } from "./_components/rewards-tab"
import { Zap, Award, Trophy, Gift } from "lucide-react"

export default async function GamificationPage() {
  const user = await requireUser()

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Gamification
            </h1>
            <p className="mt-1 text-muted-foreground">
              Complete challenges, earn badges, and climb the leaderboard.
            </p>
          </div>
          <div className="flex items-center gap-6 rounded-lg border bg-card px-4 py-2">
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-amber-500" />
              <span className="text-sm">
                <span className="font-semibold">{user.xpBalance}</span>{" "}
                <span className="text-muted-foreground">XP</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Gift className="size-4 text-emerald-500" />
              <span className="text-sm">
                <span className="font-semibold">{user.pointsBalance}</span>{" "}
                <span className="text-muted-foreground">Points</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      <Tabs defaultValue="challenges" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="challenges" className="flex items-center gap-2">
            <Zap className="size-4" />
            Challenges
          </TabsTrigger>
          <TabsTrigger value="badges" className="flex items-center gap-2">
            <Award className="size-4" />
            Badges
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center gap-2">
            <Trophy className="size-4" />
            Leaderboard
          </TabsTrigger>
          <TabsTrigger value="rewards" className="flex items-center gap-2">
            <Gift className="size-4" />
            Rewards
          </TabsTrigger>
        </TabsList>

        <TabsContent value="challenges">
          <ChallengesTab userId={user.id} />
        </TabsContent>
        <TabsContent value="badges">
          <BadgesTab userId={user.id} />
        </TabsContent>
        <TabsContent value="leaderboard">
          <LeaderboardTab userId={user.id} />
        </TabsContent>
        <TabsContent value="rewards">
          <RewardsTab userId={user.id} userPoints={user.pointsBalance} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
