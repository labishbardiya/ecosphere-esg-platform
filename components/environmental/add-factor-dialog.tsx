"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { createEmissionFactor } from "@/app/actions/environmental"
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

export function AddFactorDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setSaving(true)
    try {
      await createEmissionFactor({
        activityType: String(form.get("activityType")),
        unit: String(form.get("unit")),
        factorKgCo2e: Number(form.get("factorKgCo2e")),
        source: String(form.get("source")),
        validFrom: String(form.get("validFrom")),
      })
      toast.success("Emission factor added")
      setOpen(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add factor")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          Add factor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add emission factor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="f-activity">Activity type</Label>
            <Input
              id="f-activity"
              name="activityType"
              required
              minLength={2}
              placeholder="e.g. Grid Electricity"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="f-unit">Unit</Label>
              <Input id="f-unit" name="unit" required placeholder="kWh" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="f-value">kg CO2e per unit</Label>
              <Input
                id="f-value"
                name="factorKgCo2e"
                required
                type="number"
                min="0"
                step="any"
                placeholder="0.82"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="f-source">Source</Label>
            <Input
              id="f-source"
              name="source"
              required
              placeholder="e.g. DEFRA 2024"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="f-valid">Valid from</Label>
            <Input
              id="f-valid"
              name="validFrom"
              required
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Add factor"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
