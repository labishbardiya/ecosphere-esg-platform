"use client"

import { useRouter } from "next/navigation"
import { joinChallenge } from "@/app/actions/gamification/challenges"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap, Gift, Clock } from "lucide-react"
import { toast } from "sonner"

type Challenge = {
  id: number
  title: string
  description: string | null
  category: string
  xpReward: number
  pointsReward: number
  startDate: Date | null
  endDate: Date | null
  isActive: boolean
}

export function ChallengeCard({
  challenge,
  userStatus,
  past,
}: {
  challenge: Challenge
  userStatus: string | null
  past?: boolean
}) {
  const router = useRouter()
  const isCompleted = userStatus === "completed"
  const isJoined = userStatus === "in_progress"

  const handleJoin = async () => {
    const result = await joinChallenge(challenge.id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Joined challenge!")
      router.refresh()
    }
  }

  const categoryColors: Record<string, string> = {
    environmental: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    social: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    governance: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  }

  return (
    <Card className={`${past ? "opacity-70" : ""}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <Badge
            variant="outline"
            className={categoryColors[challenge.category] ?? ""}
          >
            {challenge.category}
          </Badge>
          {isCompleted && (
            <Badge variant="default" className="bg-emerald-600">Completed</Badge>
          )}
          {isJoined && !isCompleted && (
            <Badge variant="secondary">In Progress</Badge>
          )}
        </div>
        <CardTitle className="mt-2 text-base">{challenge.title}</CardTitle>
        {challenge.description && (
          <CardDescription>{challenge.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Zap className="size-3.5 text-amber-500" />
            {challenge.xpReward} XP
          </span>
          <span className="flex items-center gap-1">
            <Gift className="size-3.5 text-emerald-500" />
            {challenge.pointsReward} pts
          </span>
          {challenge.endDate && !past && (
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" />
              Due {new Date(challenge.endDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </CardContent>
      {!past && !isCompleted && (
        <CardFooter>
          <Button
            variant={isJoined ? "secondary" : "default"}
            size="sm"
            className="w-full"
            onClick={handleJoin}
            disabled={isJoined}
          >
            {isJoined ? "Joined" : "Join Challenge"}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
