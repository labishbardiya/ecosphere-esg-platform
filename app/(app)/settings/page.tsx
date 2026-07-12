import { requireAdmin } from "@/lib/session"
import {
  getOrgSettingsAction,
  listCategoriesAdmin,
  listDepartmentsAdmin,
} from "@/app/actions/settings"
import { SettingsClient } from "@/components/settings/settings-client"

export default async function SettingsPage() {
  await requireAdmin()
  const [settings, departments, categories] = await Promise.all([
    getOrgSettingsAction(),
    listDepartmentsAdmin(),
    listCategoriesAdmin(),
  ])

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Administration
        </h1>
        <p className="text-sm text-muted-foreground">
          ESG weights, feature toggles, departments, and categories
        </p>
      </header>
      <SettingsClient
        settings={settings}
        departments={departments}
        categories={categories}
      />
    </div>
  )
}
