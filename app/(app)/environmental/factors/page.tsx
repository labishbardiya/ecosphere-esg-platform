import { getEmissionFactors } from "@/app/actions/environmental"
import { requireUser } from "@/lib/session"
import { FactorsTable } from "@/components/environmental/factors-table"
import { AddFactorDialog } from "@/components/environmental/add-factor-dialog"

export default async function FactorsPage() {
  const user = await requireUser()
  const factors = await getEmissionFactors(user.role === "admin")

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Conversion factors used for auto-calculating CO2e. Sourced from
          DEFRA, EPA and CEA published datasets.
        </p>
        {user.role === "admin" && <AddFactorDialog />}
      </div>
      <FactorsTable
        factors={factors.map((f) => ({
          id: f.id,
          activityType: f.activityType,
          unit: f.unit,
          factorKgCo2e: Number(f.factorKgCo2e),
          source: f.source,
          validFrom: f.validFrom,
          isActive: f.isActive,
        }))}
        isAdmin={user.role === "admin"}
      />
    </div>
  )
}
