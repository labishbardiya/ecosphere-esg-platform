"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { setFactorActive } from "@/app/actions/environmental"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type Factor = {
  id: number
  activityType: string
  unit: string
  factorKgCo2e: number
  source: string
  validFrom: string
  isActive: boolean
}

export function FactorsTable({
  factors,
  isAdmin,
}: {
  factors: Factor[]
  isAdmin: boolean
}) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<number | null>(null)

  async function toggle(f: Factor) {
    setBusyId(f.id)
    try {
      await setFactorActive(f.id, !f.isActive)
      toast.success(f.isActive ? "Factor deactivated" : "Factor activated")
      router.refresh()
    } catch {
      toast.error("Failed to update factor")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Activity type</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead className="text-right">kg CO2e / unit</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Valid from</TableHead>
            <TableHead>Status</TableHead>
            {isAdmin && <TableHead className="w-24" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {factors.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={isAdmin ? 7 : 6}
                className="h-24 text-center text-muted-foreground"
              >
                No emission factors defined.
              </TableCell>
            </TableRow>
          ) : (
            factors.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{f.activityType}</TableCell>
                <TableCell>{f.unit}</TableCell>
                <TableCell className="text-right">{f.factorKgCo2e}</TableCell>
                <TableCell className="max-w-48 truncate text-muted-foreground">
                  {f.source}
                </TableCell>
                <TableCell className="whitespace-nowrap">{f.validFrom}</TableCell>
                <TableCell>
                  <Badge variant={f.isActive ? "default" : "secondary"}>
                    {f.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                {isAdmin && (
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busyId === f.id}
                      onClick={() => toggle(f)}
                    >
                      {f.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
