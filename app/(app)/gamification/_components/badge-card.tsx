import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Award, Lock } from "lucide-react"
import { cn } from "@/lib/utils"

type Badge = {
  id: number
  name: string
  description: string | null
  icon: string
  category: string
  xpThreshold: number | null
  challengeThreshold: number | null
}

export function BadgeCard({
  badge,
  earned,
}: {
  badge: Badge
  earned?: Date
}) {
  const isEarned = !!earned

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all",
        isEarned
          ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20"
          : "opacity-60",
      )}
    >
      {isEarned && (
        <div className="absolute top-2 right-2">
          <span className="text-xs text-emerald-600 dark:text-emerald-400">
            {new Date(earned).toLocaleDateString()}
          </span>
        </div>
      )}
      <CardHeader className="items-center pb-2 text-center">
        <div
          className={cn(
            "flex size-14 items-center justify-center rounded-full",
            isEarned
              ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
              : "bg-muted text-muted-foreground",
          )}
        >
          {isEarned ? (
            <Award className="size-7" />
          ) : (
            <Lock className="size-7" />
          )}
        </div>
        <CardTitle
          className={cn(
            "text-sm",
            isEarned ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {badge.name}
        </CardTitle>
        {badge.description && (
          <CardDescription className="text-xs">
            {badge.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pb-4 text-center text-xs text-muted-foreground">
        {badge.xpThreshold && (
          <p>{badge.xpThreshold} XP required</p>
        )}
        {badge.challengeThreshold && (
          <p>{badge.challengeThreshold} challenges completed</p>
        )}
      </CardContent>
    </Card>
  )
}
