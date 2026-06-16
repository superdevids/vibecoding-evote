"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"

interface ParticipationLineChartProps {
  data: { date: string; rate: number }[]
}

export function ParticipationLineChart({ data }: ParticipationLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <defs>
          <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 12 }}
          tickLine={false}
          tickFormatter={(v: number) => `${v}%`}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
          formatter={(value) => [`${Number(value).toFixed(1)}%`, "Partisipasi"]}
        />
        <Area type="monotone" dataKey="rate" fill="url(#rateGradient)" strokeWidth={0} />
        <Line
          type="monotone"
          dataKey="rate"
          stroke="#2563eb"
          strokeWidth={2}
          dot={{ fill: "#2563eb", r: 4, strokeWidth: 0 }}
          activeDot={{ r: 6, fill: "#2563eb" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
