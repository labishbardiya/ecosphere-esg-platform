import {
  getCarbonTransactions,
  getEmissionFactors,
} from "@/app/actions/environmental"
import { getDepartments } from "@/app/actions/departments"
import { requireUser } from "@/lib/session"
import { TransactionsTable } from "@/components/environmental/transactions-table"
import { AddTransactionDialog } from "@/components/environmental/add-transaction-dialog"

export default async function TransactionsPage() {
  const user = await requireUser()
  const [transactions, factors, departments] = await Promise.all([
    getCarbonTransactions(),
    getEmissionFactors(),
    getDepartments(),
  ])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {user.role === "admin"
            ? "All emission transactions across the organization."
            : "Your logged emission transactions."}
        </p>
        <AddTransactionDialog
          factors={factors.map((f) => ({
            id: f.id,
            activityType: f.activityType,
            unit: f.unit,
            factorKgCo2e: Number(f.factorKgCo2e),
          }))}
          departments={departments}
          defaultDepartmentId={user.departmentId}
        />
      </div>
      <TransactionsTable
        transactions={transactions.map((t) => ({
          id: t.id,
          sourceType: t.sourceType,
          description: t.description,
          activityType: t.activityType,
          quantity: Number(t.quantity),
          unit: t.unit,
          totalKgCo2e: Number(t.totalKgCo2e),
          departmentId: t.departmentId,
          transactionDate: t.transactionDate,
        }))}
        departments={departments}
        isAdmin={user.role === "admin"}
      />
    </div>
  )
}
