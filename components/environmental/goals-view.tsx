"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Target } from "lucide-react"
import { toast } from "sonner"
import { createGoal, updateGoalStatus } from "@/app/actions/environmental"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const METRICS = [
  { value: "emissions_reduction", label: "Emissions reduction", unit: "%" },
  { value: "recycling_rate", label: "Recycling rate target", unit: "%" },
  { value: "electricity_reduction", label: "Electricity reduction", unit: "%" },
  { value: "water_reduction", label: "Water reduction", unit: "%" },
  { value: "paper_reduction", label: "Paper reduction", unit: "%" },
  { value: "fuel_reduction", label: "Fuel reduction", unit: "%" },
] as const

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  active: "default",
  achieved: "default",
  missed: "destructive",
  archived: "secondary",
}

type Goal = {
  id: number
  title: string
  metric: string
  targetValue: number
  unit: string
  baselineValue: number | null
  departmentId: number | null
  startDate: string
  endDate: string
  status: string
}

type Department = { id: number; name: string }

export function GoalsView({
  goals,
  departments,
  isAdmin,
}: {
  goals: Goal[]
  departments: Department[]
  isAdmin: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [metric, setMetric] = useState<string>("emissions_reduction")
  const [departmentId, setDepartmentId] = useState<string>("org")

  const deptName = useMemo(
    () => new Map(departments.map((d) => [d.id, d.name])),
    [departments],
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const meta = METRICS.find((m) => m.value === metric)
    setSaving(true)
    try {
      await createGoal({
        title: String(form.get("title")),
        metric: metric as (typeof METRICS)[number]["value"],
        targetValue: Number(form.get("targetValue")),
        unit: meta?.unit ?? "%",
        baselineValue: form.get("baselineValue")
          ? Number(form.get("baselineValue"))
          : undefined,
        departmentId: departmentId !== "org" ? Number(departmentId) : undefined,
        startDate: String(form.get("startDate")),
        endDate: String(form.get("endDate")),
      })
      toast.success("Goal created")
      setOpen(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create goal")
    } finally {
      setSaving(false)
    }
  }

  async function setStatus(id: number, status: string) {
    try {
      await updateGoalStatus(
        id,
        status as "active" | "achieved" | "missed" | "archived",
      )
      toast.success("Goal updated")
      router.refresh()
    } catch {
      toast.error("Failed to update goal")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Reduction targets tracked against actuals. Only admins can create and
          resolve goals.
        </p>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="size-4" />
                New goal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create environmental goal</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="g-title">Title</Label>
                  <Input
                    id="g-title"
                    name="title"
                    required
                    minLength={2}
                    placeholder="e.g. Reduce emissions 10% by Q4"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-2">
                    <Label>Metric</Label>
                    <Select value={metric} onValueChange={setMetric}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {METRICS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="g-target">Target (%)</Label>
                    <Input
                      id="g-target"
                      name="targetValue"
                      required
                      type="number"
                      min="0.1"
                      step="any"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Scope</Label>
                  <Select value={departmentId} onValueChange={setDepartmentId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="org">Entire organization</SelectItem>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="g-start">Start date</Label>
                    <Input id="g-start" name="startDate" required type="date" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="g-end">End date</Label>
                    <Input id="g-end" name="endDate" required type="date" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="g-baseline">Baseline value (optional)</Label>
                  <Input
                    id="g-baseline"
                    name="baselineValue"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="e.g. current monthly kg CO2e"
                  />
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? "Creating..." : "Create goal"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
            <Target className="size-6" />
            <p className="text-sm">No goals defined yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((g) => (
            <Card key={g.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{g.title}</CardTitle>
                  <Badge variant={STATUS_VARIANT[g.status] ?? "secondary"}>
                    {g.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">
                  Target:{" "}
                  <span className="font-medium text-foreground">
                    {g.targetValue}
                    {g.unit}
                  </span>{" "}
                  · Scope:{" "}
                  {g.departmentId
                    ? (deptName.get(g.departmentId) ?? "Department")
                    : "Organization"}{" "}
                  · {g.startDate} → {g.endDate}
                </p>
                {g.baselineValue != null && (
                  <p className="text-sm text-muted-foreground">
                    Baseline: {g.baselineValue.toLocaleString()}
                  </p>
                )}
                {isAdmin && g.status === "active" && (
                  <div className="mt-1 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStatus(g.id, "achieved")}
                    >
                      Mark achieved
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStatus(g.id, "missed")}
                    >
                      Mark missed
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStatus(g.id, "archived")}
                    >
                      Archive
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
