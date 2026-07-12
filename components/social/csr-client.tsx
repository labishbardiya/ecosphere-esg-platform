"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  createCsrActivity,
  joinCsrActivity,
  reviewCsrParticipation,
  submitCsrProof,
} from "@/app/actions/social"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Activity = {
  id: number
  title: string
  description: string | null
  location: string | null
  capacity: number | null
  pointsReward: number
  status: string
  categoryName: string | null
  participantCount: number
}

type Category = { id: number; name: string }

export function CreateCsrForm({
  categories,
  canCreate,
}: {
  categories: Category[]
  canCreate: boolean
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [pointsReward, setPointsReward] = useState("20")
  const [categoryId, setCategoryId] = useState("")

  if (!canCreate) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Create CSR activity</CardTitle>
        <CardDescription>
          Managers and admins can publish programs for employees.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            setError(null)
            start(async () => {
              try {
                await createCsrActivity({
                  title,
                  description,
                  location,
                  pointsReward: Number(pointsReward),
                  categoryId: categoryId ? Number(categoryId) : null,
                  status: "active",
                })
                setTitle("")
                setDescription("")
                setLocation("")
                router.refresh()
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed")
              }
            })
          }}
        >
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="csr-title">Title</Label>
            <Input
              id="csr-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={2}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="csr-desc">Description</Label>
            <Textarea
              id="csr-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="csr-loc">Location</Label>
            <Input
              id="csr-loc"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="csr-pts">Points reward</Label>
            <Input
              id="csr-pts"
              type="number"
              min={0}
              value={pointsReward}
              onChange={(e) => setPointsReward(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Optional category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && (
            <p className="text-sm text-destructive sm:col-span-2" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={pending} className="sm:col-span-2">
            {pending ? "Creating…" : "Publish activity"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export function ActivityList({
  activities,
  myJoinedIds,
}: {
  activities: Activity[]
  myJoinedIds: number[]
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [proof, setProof] = useState<Record<number, string>>({})
  const [msg, setMsg] = useState<string | null>(null)

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No CSR activities yet. Create one to start engagement.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {activities.map((a) => {
        const joined = myJoinedIds.includes(a.id)
        return (
          <Card key={a.id} className="card-hover animate-fade-up">
            <CardHeader className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{a.title}</CardTitle>
                <Badge variant="secondary">{a.status}</Badge>
              </div>
              <CardDescription>
                {a.categoryName ?? "Uncategorized"}
                {a.location ? ` · ${a.location}` : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {a.description || "No description"}
              </p>
              <p className="text-xs text-muted-foreground">
                {a.pointsReward} pts · {a.participantCount} joined
                {a.capacity ? ` / ${a.capacity} capacity` : ""}
              </p>
              {!joined ? (
                <div className="space-y-2">
                  <Input
                    placeholder="Proof URL (optional now, required for approval)"
                    value={proof[a.id] ?? ""}
                    onChange={(e) =>
                      setProof((p) => ({ ...p, [a.id]: e.target.value }))
                    }
                  />
                  <Button
                    size="sm"
                    disabled={pending || a.status === "cancelled"}
                    onClick={() => {
                      setMsg(null)
                      start(async () => {
                        const res = await joinCsrActivity(a.id, proof[a.id])
                        if ("error" in res && res.error) setMsg(res.error)
                        else {
                          setMsg("Joined — pending approval")
                          router.refresh()
                        }
                      })
                    }}
                  >
                    Join activity
                  </Button>
                </div>
              ) : (
                <p className="text-sm font-medium text-primary">
                  You have joined this activity
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}
      {msg && (
        <p className="text-sm text-muted-foreground md:col-span-2" role="status">
          {msg}
        </p>
      )}
    </div>
  )
}

export function ParticipationPanel({
  mine,
  pendingReviews,
  canReview,
}: {
  mine: Array<{
    id: number
    status: string
    proofUrl: string | null
    pointsEarned: number
    activityTitle: string
    pointsReward: number
  }>
  pendingReviews: Array<{
    id: number
    userName: string
    userEmail: string
    activityTitle: string
    proofUrl: string | null
    pointsReward: number
  }>
  canReview: boolean
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [proof, setProof] = useState<Record<number, string>>({})
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">My participation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mine.length === 0 && (
            <p className="text-sm text-muted-foreground">
              You have not joined any CSR activities yet.
            </p>
          )}
          {mine.map((m) => (
            <div
              key={m.id}
              className="rounded-lg border p-3 text-sm space-y-2"
            >
              <div className="flex justify-between gap-2">
                <span className="font-medium">{m.activityTitle}</span>
                <Badge variant="outline">{m.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Reward: {m.pointsReward} pts
                {m.pointsEarned
                  ? ` · Earned: ${m.pointsEarned}`
                  : ""}
              </p>
              {m.status !== "approved" && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Proof URL / file link"
                    value={proof[m.id] ?? m.proofUrl ?? ""}
                    onChange={(e) =>
                      setProof((p) => ({ ...p, [m.id]: e.target.value }))
                    }
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => {
                      setError(null)
                      start(async () => {
                        const url = proof[m.id] ?? m.proofUrl ?? ""
                        const res = await submitCsrProof(m.id, url)
                        if ("error" in res && res.error) setError(res.error)
                        else router.refresh()
                      })
                    }}
                  >
                    Save proof
                  </Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {canReview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending approvals</CardTitle>
            <CardDescription>
              Proof is required when org setting is enabled.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingReviews.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No pending reviews.
              </p>
            )}
            {pendingReviews.map((p) => (
              <div key={p.id} className="rounded-lg border p-3 space-y-2">
                <p className="text-sm font-medium">{p.activityTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {p.userName} · {p.userEmail}
                </p>
                <p className="text-xs">
                  Proof:{" "}
                  {p.proofUrl ? (
                    <a
                      href={p.proofUrl}
                      className="underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {p.proofUrl}
                    </a>
                  ) : (
                    <span className="text-amber-600">Missing</span>
                  )}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={pending}
                    onClick={() => {
                      setError(null)
                      start(async () => {
                        const res = await reviewCsrParticipation(
                          p.id,
                          "approved",
                        )
                        if ("error" in res && res.error) setError(res.error)
                        else router.refresh()
                      })
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => {
                      setError(null)
                      start(async () => {
                        const res = await reviewCsrParticipation(
                          p.id,
                          "rejected",
                        )
                        if ("error" in res && res.error) setError(res.error)
                        else router.refresh()
                      })
                    }}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
