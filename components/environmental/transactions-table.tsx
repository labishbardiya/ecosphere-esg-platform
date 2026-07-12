"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { deleteCarbonTransaction } from "@/app/actions/environmental"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

type Tx = {
  id: number
  sourceType: string
  description: string
  activityType: string
  quantity: number
  unit: string
  totalKgCo2e: number
  departmentId: number
  transactionDate: string
}

type Department = { id: number; name: string }

export function TransactionsTable({
  transactions,
  departments,
  isAdmin,
}: {
  transactions: Tx[]
  departments: Department[]
  isAdmin: boolean
}) {
  const router = useRouter()
  const [deptFilter, setDeptFilter] = useState<string>("all")
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const deptName = useMemo(
    () => new Map(departments.map((d) => [d.id, d.name])),
    [departments],
  )

  const filtered = transactions.filter(
    (t) =>
      (deptFilter === "all" || t.departmentId === Number(deptFilter)) &&
      (sourceFilter === "all" || t.sourceType === sourceFilter),
  )

  const sourceTypes = [...new Set(transactions.map((t) => t.sourceType))]

  async function handleDelete(id: number) {
    setDeletingId(id)
    try {
      await deleteCarbonTransaction(id)
      toast.success("Transaction deleted")
      router.refresh()
    } catch {
      toast.error("Failed to delete")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={String(d.id)}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            {sourceTypes.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Department</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">kg CO2e</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  No transactions yet. Log your first emission event.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="whitespace-nowrap">
                    {t.transactionDate}
                  </TableCell>
                  <TableCell className="max-w-52 truncate">
                    {t.description}
                  </TableCell>
                  <TableCell>{t.activityType}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {t.sourceType}
                    </Badge>
                  </TableCell>
                  <TableCell>{deptName.get(t.departmentId) ?? "—"}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {t.quantity} {t.unit}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {t.totalKgCo2e.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        disabled={deletingId === t.id}
                        onClick={() => handleDelete(t.id)}
                        aria-label={`Delete transaction ${t.description}`}
                      >
                        <Trash2 className="size-4 text-muted-foreground" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        {filtered.length} of {transactions.length} transactions shown
      </p>
    </div>
  )
}
