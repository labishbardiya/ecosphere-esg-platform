"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  createCategory,
  createDepartment,
  updateEsgWeights,
  updateFeatureToggles,
} from "@/app/actions/settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function SettingsClient({
  settings,
  departments,
  categories,
}: {
  settings: Record<string, string>
  departments: Array<{ id: number; name: string; description: string | null }>
  categories: Array<{
    id: number
    name: string
    type: string
    isActive: boolean
  }>
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)

  const [wEnv, setWEnv] = useState(settings.weight_environmental ?? "0.4")
  const [wSoc, setWSoc] = useState(settings.weight_social ?? "0.3")
  const [wGov, setWGov] = useState(settings.weight_governance ?? "0.3")

  const [toggles, setToggles] = useState({
    require_csr_evidence: settings.require_csr_evidence === "true",
    badge_auto_award: settings.badge_auto_award === "true",
    notify_compliance: settings.notify_compliance === "true",
    notify_csr_decisions: settings.notify_csr_decisions === "true",
    notify_badge_unlocks: settings.notify_badge_unlocks === "true",
    notify_policy_reminders: settings.notify_policy_reminders === "true",
  })

  const [deptName, setDeptName] = useState("")
  const [catName, setCatName] = useState("")
  const [catType, setCatType] = useState<"csr" | "challenge">("csr")

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ESG score weights</CardTitle>
          <CardDescription>
            Default 40% Environmental / 30% Social / 30% Governance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Environmental</Label>
              <Input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={wEnv}
                onChange={(e) => setWEnv(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Social</Label>
              <Input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={wSoc}
                onChange={(e) => setWSoc(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Governance</Label>
              <Input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={wGov}
                onChange={(e) => setWGov(e.target.value)}
              />
            </div>
          </div>
          <Button
            disabled={pending}
            onClick={() =>
              start(async () => {
                await updateEsgWeights({
                  weight_environmental: Number(wEnv),
                  weight_social: Number(wSoc),
                  weight_governance: Number(wGov),
                })
                setMsg("Weights saved")
                router.refresh()
              })
            }
          >
            Save weights
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Business rule toggles</CardTitle>
          <CardDescription>
            Section 8 configuration (evidence, badges, notifications)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(
            [
              ["require_csr_evidence", "Require CSR proof before approval"],
              ["badge_auto_award", "Auto-award badges"],
              ["notify_compliance", "Notify on compliance issues"],
              ["notify_csr_decisions", "Notify CSR approve/reject"],
              ["notify_badge_unlocks", "Notify badge unlocks"],
              ["notify_policy_reminders", "Notify new policies"],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span>{label}</span>
              <input
                type="checkbox"
                className="size-4"
                checked={toggles[key]}
                onChange={(e) =>
                  setToggles((t) => ({ ...t, [key]: e.target.checked }))
                }
              />
            </label>
          ))}
          <Button
            disabled={pending}
            onClick={() =>
              start(async () => {
                await updateFeatureToggles(toggles)
                setMsg("Toggles saved")
                router.refresh()
              })
            }
          >
            Save toggles
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Departments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="space-y-1 text-sm">
            {departments.map((d) => (
              <li key={d.id} className="border-b py-1 last:border-0">
                {d.name}
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Input
              placeholder="New department"
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
            />
            <Button
              disabled={pending || !deptName.trim()}
              onClick={() =>
                start(async () => {
                  await createDepartment(deptName.trim())
                  setDeptName("")
                  router.refresh()
                })
              }
            >
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="max-h-40 space-y-1 overflow-y-auto text-sm">
            {categories.map((c) => (
              <li key={c.id} className="flex justify-between border-b py-1">
                <span>{c.name}</span>
                <span className="text-muted-foreground">{c.type}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Category name"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
            />
            <Select
              value={catType}
              onValueChange={(v) => setCatType(v as "csr" | "challenge")}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csr">CSR</SelectItem>
                <SelectItem value="challenge">Challenge</SelectItem>
              </SelectContent>
            </Select>
            <Button
              disabled={pending || !catName.trim()}
              onClick={() =>
                start(async () => {
                  await createCategory(catName.trim(), catType)
                  setCatName("")
                  router.refresh()
                })
              }
            >
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {msg && (
        <p className="text-sm text-primary lg:col-span-2" role="status">
          {msg}
        </p>
      )}
    </div>
  )
}
