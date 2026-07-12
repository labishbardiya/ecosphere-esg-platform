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
  "hsl(160 84% 30%)",
  "hsl(160 60% 45%)",
  "hsl(40 90% 50%)",
  "hsl(20 80% 55%)",
  "hsl(200 60% 45%)",
  "hsl(260 40% 55%)",
  "hsl(0 60% 55%)",
]

type Props = {
  monthlySeries: { month: string; kg_co2e: number }[]
  bySource: { source: string; kg_co2e: number }[]
  byDepartment: { department: string; kg_co2e: number }[]
}

export function EnvCharts({ monthlySeries, bySource, byDepartment }: Props) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">
            Emissions over time (kg CO2e)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {monthlySeries.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlySeries}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="kg_co2e"
                  name="kg CO2e"
                  stroke={COLORS[0]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">By source type</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {bySource.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bySource}
                  dataKey="kg_co2e"
                  nameKey="source"
                  innerRadius={45}
                  outerRadius={80}
                  label={(entry) => String(entry.name ?? "")}
                  fontSize={12}
                >
                  {bySource.map((entry, i) => (
                    <Cell key={entry.source} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">By department</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {byDepartment.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDepartment} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="department"
                  width={100}
                  fontSize={12}
                />
                <Tooltip />
                <Bar dataKey="kg_co2e" name="kg CO2e" fill={COLORS[0]} radius={4} />
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
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      No data yet — log carbon transactions to see this chart.
    </div>
  )
}
