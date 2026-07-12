"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Trophy, Zap, Gift, Award, Medal } from "lucide-react"
import { cn } from "@/lib/utils"

type LeaderboardEntry = {
  id: string
  name: string
  role: string
  xpBalance: number
  pointsBalance: number
  completedChallenges: number
  badgeCount: number
}

const rankIcons = [
  { icon: Trophy, color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-900/30" },
  { icon: Medal, color: "text-gray-400", bg: "bg-gray-100 dark:bg-gray-800" },
  { icon: Medal, color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900/30" },
]

export function LeaderboardTable({
  entries,
  currentUserId,
}: {
  entries: LeaderboardEntry[]
  currentUserId: string
}) {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">#</TableHead>
            <TableHead>Employee</TableHead>
            <TableHead className="text-right">XP</TableHead>
            <TableHead className="text-right">Points</TableHead>
            <TableHead className="text-right">Challenges</TableHead>
            <TableHead className="text-right">Badges</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry, index) => {
            const isCurrentUser = entry.id === currentUserId
            const RankIcon = rankIcons[index]

            return (
              <TableRow
                key={entry.id}
                className={cn(
                  isCurrentUser && "bg-primary/5 font-medium",
                )}
              >
                <TableCell className="text-center">
                  {index < 3 ? (
                    <div
                      className={cn(
                        "mx-auto flex size-8 items-center justify-center rounded-full",
                        RankIcon.bg,
                      )}
                    >
                      <RankIcon.icon className={cn("size-4", RankIcon.color)} />
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {index + 1}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback>
                        {entry.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="text-sm">{entry.name}</span>
                      {isCurrentUser && (
                        <Badge
                          variant="outline"
                          className="ml-2 text-[10px]"
                        >
                          You
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className="flex items-center justify-end gap-1">
                    <Zap className="size-3.5 text-amber-500" />
                    {entry.xpBalance.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="flex items-center justify-end gap-1">
                    <Gift className="size-3.5 text-emerald-500" />
                    {entry.pointsBalance.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {entry.completedChallenges}
                </TableCell>
                <TableCell className="text-right">
                  <span className="flex items-center justify-end gap-1">
                    <Award className="size-3.5 text-amber-500" />
                    {entry.badgeCount}
                  </span>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
