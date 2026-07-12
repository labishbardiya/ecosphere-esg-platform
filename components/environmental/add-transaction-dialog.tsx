"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { createCarbonTransaction } from "@/app/actions/environmental"
import { Button } from "@/components/ui/button"
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

const SOURCE_TYPES = [
  "energy",
  "fleet",
  "travel",
  "purchase",
  "manufacturing",
  "expense",
  "other",
] as const

type Factor = {
  id: number
  activityType: string
  unit: string
  factorKgCo2e: number
}

type Department = { id: number; name: string }

export function AddTransactionDialog({
  factors,
  departments,
  defaultDepartmentId,
}: {
  factors: Factor[]
  departments: Department[]
  defaultDepartmentId: number | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sourceType, setSourceType] = useState<string>("energy")
  const [factorId, setFactorId] = useState<string>("")
  const [quantity, setQuantity] = useState<string>("")
  const [departmentId, setDepartmentId] = useState<string>(
    defaultDepartmentId ? String(defaultDepartmentId) : "",
  )
  const [description, setDescription] = useState("")
  const [txDate, setTxDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  )

  const selectedFactor = useMemo(
    () => factors.find((f) => String(f.id) === factorId),
    [factors, factorId],
  )

  const preview = useMemo(() => {
    const qty = Number(quantity)
    if (!selectedFactor || !qty || qty <= 0) return null
    return qty * selectedFactor.factorKgCo2e
  }, [selectedFactor, quantity])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!factorId || !departmentId) {
      toast.error("Select an activity type and department")
      return
    }
    setSaving(true)
    try {
      await createCarbonTransaction({
        sourceType: sourceType as (typeof SOURCE_TYPES)[number],
        description,
        factorId: Number(factorId),
        quantity: Number(quantity),
        departmentId: Number(departmentId),
        transactionDate: txDate,
      })
      toast.success("Transaction recorded")
      setOpen(false)
      setDescription("")
      setQuantity("")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          Log transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log carbon transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="tx-desc">Description</Label>
            <Input
              id="tx-desc"
              required
              minLength={2}
              maxLength={300}
              placeholder="e.g. Office electricity bill - June"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label>Source type</Label>
              <Select value={sourceType} onValueChange={setSourceType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_TYPES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
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

          <div className="flex flex-col gap-2">
            <Label>Activity (emission factor)</Label>
            <Select value={factorId} onValueChange={setFactorId}>
              <SelectTrigger>
                <SelectValue placeholder="Select activity type" />
              </SelectTrigger>
              <SelectContent>
                {factors.map((f) => (
                  <SelectItem key={f.id} value={String(f.id)}>
                    {f.activityType} ({f.factorKgCo2e} kg/{f.unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="tx-qty">
                Quantity{selectedFactor ? ` (${selectedFactor.unit})` : ""}
              </Label>
              <Input
                id="tx-qty"
                required
                type="number"
                min="0.0001"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="tx-date">Date</Label>
              <Input
                id="tx-date"
                required
                type="date"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
              />
            </div>
          </div>

          {preview != null && (
            <p className="rounded-md bg-muted px-3 py-2 text-sm">
              Calculated emissions:{" "}
              <span className="font-semibold">
                {preview >= 1000
                  ? `${(preview / 1000).toFixed(3)} t`
                  : `${preview.toFixed(2)} kg`}{" "}
                CO2e
              </span>
            </p>
          )}

          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Record transaction"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
