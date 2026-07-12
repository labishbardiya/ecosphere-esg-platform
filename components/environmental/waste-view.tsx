"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Recycle } from "lucide-react"
import { toast } from "sonner"
import { createWasteLog } from "@/app/actions/environmental"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const CATEGORIES = [
  { value: "recycled", label: "Recycled" },
  { value: "organic", label: "Organic / Composted" },
  { value: "landfill", label: "Landfill" },
  { value: "e-waste", label: "E-Waste" },
  { value: "hazardous", label: "Hazardous" },
] as const

type WasteLog = {
  id: number
  category: string
  weightKg: number
  departmentId: number
  logDate: string
  notes: string | null
}

type Department = { id: number; name: string }

export function WasteView({
  logs,
  departments,
  defaultDepartmentId,
}: {
  logs: WasteLog[]
  departments: Department[]
  defaultDepartmentId: number | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [category, setCategory] = useState<string>("recycled")
  const [departmentId, setDepartmentId] = useState(
    defaultDepartmentId ? String(defaultDepartmentId) : "",
  )

  const deptName = useMemo(
    () => new Map(departments.map((d) => [d.id, d.name])),
    [departments],
  )

  const { total, diverted } = useMemo(() => {
    let total = 0
    let diverted = 0
    for (const l of logs) {
      total += l.weightKg
      if (l.category === "recycled" || l.category === "organic")
        diverted += l.weightKg
    }
    return { total, diverted }
  }, [logs])

  const recyclingRate = total > 0 ? (diverted / total) * 100 : null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    if (!departmentId) {
      toast.error("Select a department")
      return
    }
    setSaving(true)
    try {
      await createWasteLog({
        category: category as (typeof CATEGORIES)[number]["value"],
        weightKg: Number(form.get("weightKg")),
        departmentId: Number(departmentId),
        logDate: String(form.get("logDate")),
        notes: String(form.get("notes") ?? "") || undefined,
      })
      toast.success("Waste log recorded")
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
          Waste by category. Recycling rate = (recycled + organic) / total
          (GRI 306 diversion metric).
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4" />
              Log waste
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Log waste</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
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
                  <Label htmlFor="w-weight">Weight (kg)</Label>
                  <Input
                    id="w-weight"
                    name="weightKg"
                    required
                    type="number"
                    min="0.01"
                    step="any"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="w-date">Date</Label>
                  <Input
                    id="w-date"
                    name="logDate"
                    required
                    type="date"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="w-notes">Notes (optional)</Label>
                <Input id="w-notes" name="notes" maxLength={300} />
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Record waste"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total waste logged
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{total.toFixed(1)} kg</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Diverted from landfill
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{diverted.toFixed(1)} kg</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <Recycle className="size-4" />
              Recycling rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {recyclingRate != null ? `${recyclingRate.toFixed(1)}%` : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Department</TableHead>
              <TableHead className="text-right">Weight (kg)</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  No waste logged yet.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{l.logDate}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        l.category === "recycled" || l.category === "organic"
                          ? "default"
                          : "secondary"
                      }
                      className="capitalize"
                    >
                      {l.category}
                    </Badge>
                  </TableCell>
                  <TableCell>{deptName.get(l.departmentId) ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    {l.weightKg.toFixed(1)}
                  </TableCell>
                  <TableCell className="max-w-48 truncate text-muted-foreground">
                    {l.notes ?? ""}
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
