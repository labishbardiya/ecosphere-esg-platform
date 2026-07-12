"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  acknowledgePolicy,
  createAudit,
  createComplianceIssue,
  createPolicy,
  updateAuditStatus,
  updateIssueStatus,
} from "@/app/actions/governance"
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

export function CreatePolicyForm({ canCreate }: { canCreate: boolean }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [version, setVersion] = useState("1.0")
  const [content, setContent] = useState("")

  if (!canCreate) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Publish policy</CardTitle>
        <CardDescription>
          Active policies create acknowledgement tasks for every employee.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            setError(null)
            start(async () => {
              try {
                await createPolicy({
                  title,
                  version,
                  content,
                  status: "active",
                })
                setTitle("")
                setContent("")
                router.refresh()
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed")
              }
            })
          }}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-2">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                minLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Version</Label>
              <Input
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Content</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              required
              minLength={10}
            />
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "Publishing…" : "Publish active policy"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export function PolicyAckList({
  items,
}: {
  items: Array<{
    id: number
    policyId: number
    title: string
    version: string
    content: string
    status: string
  }>
}) {
  const router = useRouter()
  const [pending, start] = useTransition()

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No policies require your acknowledgement.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {items.map((p) => (
        <Card key={p.id}>
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base">
                {p.title}{" "}
                <span className="text-muted-foreground font-normal">
                  v{p.version}
                </span>
              </CardTitle>
            </div>
            <Badge variant={p.status === "accepted" ? "default" : "secondary"}>
              {p.status}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {p.content}
            </p>
            {p.status === "pending" && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      await acknowledgePolicy(p.policyId, "accepted")
                      router.refresh()
                    })
                  }
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      await acknowledgePolicy(p.policyId, "rejected")
                      router.refresh()
                    })
                  }
                >
                  Reject
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function IssuesPanel({
  issues,
  users,
  departments,
  canCreate,
}: {
  issues: Array<{
    id: number
    title: string
    description: string | null
    severity: string
    status: string
    dueDate: string
    ownerName: string | null
    departmentName: string | null
  }>
  users: Array<{ id: string; name: string; email: string }>
  departments: Array<{ id: number; name: string }>
  canCreate: boolean
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [severity, setSeverity] = useState("medium")
  const [ownerId, setOwnerId] = useState("")
  const [departmentId, setDepartmentId] = useState("")
  const [dueDate, setDueDate] = useState("")

  return (
    <div className="space-y-6">
      {canCreate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Raise compliance issue</CardTitle>
            <CardDescription>
              Owner and due date are mandatory (Section 8 business rule).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault()
                setError(null)
                start(async () => {
                  const res = await createComplianceIssue({
                    title,
                    description,
                    severity: severity as
                      | "low"
                      | "medium"
                      | "high"
                      | "critical",
                    ownerId,
                    departmentId: departmentId
                      ? Number(departmentId)
                      : null,
                    dueDate,
                  })
                  if ("error" in res && res.error) setError(res.error)
                  else {
                    setTitle("")
                    setDescription("")
                    router.refresh()
                  }
                })
              }}
            >
              <div className="space-y-2 sm:col-span-2">
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["low", "medium", "high", "critical"].map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Due date</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Owner</Label>
                <Select value={ownerId} onValueChange={setOwnerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Assign owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {error && (
                <p className="text-sm text-destructive sm:col-span-2">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                disabled={pending || !ownerId || !dueDate}
                className="sm:col-span-2"
              >
                Create issue
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {issues.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No compliance issues logged.
            </CardContent>
          </Card>
        )}
        {issues.map((issue) => {
          const overdue =
            issue.status !== "resolved" &&
            issue.status !== "closed" &&
            issue.dueDate < new Date().toISOString().slice(0, 10)
          return (
            <Card key={issue.id}>
              <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{issue.title}</p>
                    <Badge variant="outline">{issue.severity}</Badge>
                    <Badge variant={overdue ? "destructive" : "secondary"}>
                      {overdue ? "overdue" : issue.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Owner: {issue.ownerName ?? "—"} · Dept:{" "}
                    {issue.departmentName ?? "—"} · Due {issue.dueDate}
                  </p>
                  {issue.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {issue.description}
                    </p>
                  )}
                </div>
                {issue.status !== "resolved" && issue.status !== "closed" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() =>
                        start(async () => {
                          await updateIssueStatus(issue.id, "in_progress")
                          router.refresh()
                        })
                      }
                    >
                      In progress
                    </Button>
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        start(async () => {
                          await updateIssueStatus(issue.id, "resolved")
                          router.refresh()
                        })
                      }
                    >
                      Resolve
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export function AuditsPanel({
  audits,
  departments,
  canCreate,
}: {
  audits: Array<{
    id: number
    title: string
    description: string | null
    status: string
    scheduledDate: string | null
    departmentName: string | null
    findings: string | null
  }>
  departments: Array<{ id: number; name: string }>
  canCreate: boolean
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [departmentId, setDepartmentId] = useState("")
  const [scheduledDate, setScheduledDate] = useState("")

  return (
    <div className="space-y-6">
      {canCreate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Schedule audit</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault()
                start(async () => {
                  await createAudit({
                    title,
                    description,
                    departmentId: departmentId
                      ? Number(departmentId)
                      : null,
                    scheduledDate: scheduledDate || null,
                    status: "scheduled",
                  })
                  setTitle("")
                  setDescription("")
                  router.refresh()
                })
              }}
            >
              <div className="space-y-2 sm:col-span-2">
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Scheduled date</Label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={pending} className="sm:col-span-2">
                Create audit
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {audits.map((a) => (
          <Card key={a.id}>
            <CardHeader>
              <div className="flex justify-between gap-2">
                <CardTitle className="text-base">{a.title}</CardTitle>
                <Badge variant="secondary">{a.status}</Badge>
              </div>
              <CardDescription>
                {a.departmentName ?? "All depts"}
                {a.scheduledDate ? ` · ${a.scheduledDate}` : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {a.description || "No description"}
              </p>
              {a.status !== "completed" && canCreate && (
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      "in_progress",
                      "review",
                      "completed",
                    ] as const
                  ).map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() =>
                        start(async () => {
                          await updateAuditStatus(a.id, s)
                          router.refresh()
                        })
                      }
                    >
                      Mark {s.replace("_", " ")}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
