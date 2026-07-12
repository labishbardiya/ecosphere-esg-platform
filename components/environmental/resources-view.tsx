"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { upsertResourceUsage } from "@/app/actions/environmental"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const RESOURCE_META: Record<string, { label: string; unit: string }> = {
  electricity: { label: "Electricity", unit: "kWh" },
  water: { label: "Water", unit: "litres" },
  paper: { label: "Paper", unit: "kg" },
  fuel: { label: "Fuel", unit: "litres" },
}

type Usage = {
  id: number
  resourceType: string
  quantity: number
  unit: string
  departmentId: number
  periodMonth: string
  notes: string | null
}

type Department = { id: number; name: string }

export function ResourcesView({
  usage,
  departments,
  defaultDepartmentId,
}: {
  usage: Usage[]
  departments: Department[]
  defaultDepartmentId: number | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [resourceType, setResourceType] = useState("electricity")
  const [departmentId, setDepartmentId] = useState(
    defaultDepartmentId ? String(defaultDepartmentId) : "",
  )

  const deptName = useMemo(
    () => new Map(departments.map((d) => [d.id, d.name])),
    [departments],
  )

  // Per-resource totals for the latest month present in the data
  const latestMonth = usage[0]?.periodMonth
  const latestTotals = useMemo(() => {
    if (!latestMonth) return []
    const byType = new Map<string, number>()
    for (const u of usage) {
      if (u.periodMonth !== latestMonth) continue
      byType.set(u.resourceType, (byType.get(u.resourceType) ?? 0) + u.quantity)
    }
    return [...byType.entries()]
  }, [usage, latestMonth])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    if (!departmentId) {
      toast.error("Select a department")
      return
    }
    setSaving(true)
    try {
      await upsertResourceUsage({
        resourceType: resourceType as "electricity" | "water" | "paper" | "fuel",
        quantity: Number(form.get("quantity")),
        departmentId: Number(departmentId),
        periodMonth: String(form.get("periodMonth")),
        notes: String(form.get("notes") ?? "") || undefined,
      })
      toast.success("Resource usage saved")
      setOpen(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Monthly consumption per department. One entry per resource, department
          and month (re-submitting updates it).
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4" />
              Log usage
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Log resource usage</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Label>Resource</Label>
                  <Select value={resourceType} onValueChange={setResourceType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(RESOURCE_META).map(([key, meta]) => (
                        <SelectItem key={key} value={key}>
                          {meta.label} ({meta.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Department</Label>
                  <Select value={departmentId} onValueChange={setDepartmentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
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
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="r-qty">
                    Quantity ({RESOURCE_META[resourceType].unit})
                  </Label>
                  <Input
                    id="r-qty"
                    name="quantity"
                    required
                    type="number"
                    min="0"
                    step="any"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="r-month">Month</Label>
                  <Input
                    id="r-month"
                    name="periodMonth"
                    required
                    type="month"
                    defaultValue={new Date().toISOString().slice(0, 7)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="r-notes">Notes (optional)</Label>
                <Input id="r-notes" name="notes" maxLength={300} />
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save usage"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {latestTotals.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {latestTotals.map(([type, total]) => (
            <Card key={type}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {RESOURCE_META[type]?.label ?? type} — {latestMonth?.slice(0, 7)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {total.toLocaleString()}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    {RESOURCE_META[type]?.unit}
                  </span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Department</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usage.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  No resource usage logged yet.
                </TableCell>
              </TableRow>
            ) : (
              usage.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.periodMonth.slice(0, 7)}</TableCell>
                  <TableCell>
                    {RESOURCE_META[u.resourceType]?.label ?? u.resourceType}
                  </TableCell>
                  <TableCell>{deptName.get(u.departmentId) ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    {u.quantity.toLocaleString()} {u.unit}
                  </TableCell>
                  <TableCell className="max-w-48 truncate text-muted-foreground">
                    {u.notes ?? ""}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
