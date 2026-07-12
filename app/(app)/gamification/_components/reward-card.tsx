"use client"

import { useRouter } from "next/navigation"
import { redeemReward } from "@/app/actions/gamification/rewards"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Gift, Package } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type Reward = {
  id: number
  name: string
  description: string | null
  pointsCost: number
  stock: number
  imageUrl: string | null
  isActive: boolean
}

export function RewardCard({
  reward,
  userPoints,
}: {
  reward: Reward
  userPoints: number
}) {
  const router = useRouter()
  const canAfford = userPoints >= reward.pointsCost

  const handleRedeem = async () => {
    const result = await redeemReward(reward.id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Reward redeemed!")
      router.refresh()
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Gift className="size-6" />
        </div>
        <CardTitle className="text-base">{reward.name}</CardTitle>
        {reward.description && (
          <CardDescription>{reward.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Package className="size-3.5" />
            {reward.stock} left
          </span>
          <Badge
            variant={canAfford ? "default" : "secondary"}
            className={cn(
              canAfford && "bg-emerald-600 hover:bg-emerald-600",
            )}
          >
            {reward.pointsCost} pts
          </Badge>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          variant={canAfford ? "default" : "secondary"}
          size="sm"
          className="w-full"
          onClick={handleRedeem}
          disabled={!canAfford}
        >
          {canAfford ? "Redeem" : `Need ${reward.pointsCost - userPoints} more`}
        </Button>
      </CardFooter>
    </Card>
  )
}
