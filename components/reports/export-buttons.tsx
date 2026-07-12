"use client"

import { useTransition } from "react"
import { exportReportCsv } from "@/app/actions/reports"
import { Button } from "@/components/ui/button"

function download(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function ReportExportButtons() {
  const [pending, start] = useTransition()

  const run = (
    module: "environmental" | "social" | "governance" | "summary",
  ) => {
    start(async () => {
      const res = await exportReportCsv(module)
      download(res.filename, res.csv)
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => run("summary")}
      >
        Export ESG Summary CSV
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => run("environmental")}
      >
        Export Environmental
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => run("social")}
      >
        Export Social
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => run("governance")}
      >
        Export Governance
      </Button>
    </div>
  )
}
