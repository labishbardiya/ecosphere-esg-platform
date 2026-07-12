"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const COLORS = [
  "#059669",
  "#0d9488",
  "#eab308",
  "#f97316",
  "#0284c7",
  "#7c3aed",
  "#e11d48",
]

type Props = {
  monthlySeries: { month: string; kg_co2e: number }[]
  bySource: { source: string; kg_co2e: number }[]
  byDepartment: { department: string; kg_co2e: number }[]
}

export function EnvCharts({ monthlySeries, bySource, byDepartment }: Props) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="gap-0 border-border/80 py-0 shadow-sm lg:col-span-2">
        <CardHeader className="px-5 pb-2 pt-4">
          <CardTitle className="text-base font-semibold">
            Emissions over time (kg CO₂e)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-72 px-2 pb-4 sm:px-4">
          {monthlySeries.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlySeries} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="envLine" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#059669" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                <XAxis
                  dataKey="month"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#71717a" }}
                />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#71717a" }}
                  width={48}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e4e4e7",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="kg_co2e"
                  name="kg CO₂e"
                  stroke="#059669"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#059669", strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="gap-0 border-border/80 py-0 shadow-sm">
        <CardHeader className="px-5 pb-2 pt-4">
          <CardTitle className="text-base font-semibold">By source type</CardTitle>
        </CardHeader>
        <CardContent className="h-64 px-2 pb-4">
          {bySource.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bySource}
                  dataKey="kg_co2e"
                  nameKey="source"
                  innerRadius={50}
                  outerRadius={88}
                  paddingAngle={2}
                  label={(entry) => String(entry.name ?? "")}
                  fontSize={11}
                >
                  {bySource.map((entry, i) => (
                    <Cell key={entry.source} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e4e4e7",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="gap-0 border-border/80 py-0 shadow-sm">
        <CardHeader className="px-5 pb-2 pt-4">
          <CardTitle className="text-base font-semibold">By department</CardTitle>
        </CardHeader>
        <CardContent className="h-64 px-2 pb-4">
          {byDepartment.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDepartment} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" horizontal={false} />
                <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="department"
                  width={100}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e4e4e7",
                  }}
                />
                <Bar
                  dataKey="kg_co2e"
                  name="kg CO₂e"
                  fill="#059669"
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
      No data yet — log carbon transactions to see this chart.
    </div>
  )
}
