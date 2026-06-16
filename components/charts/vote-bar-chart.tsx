"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts"

interface VoteBarChartProps {
  data: { name: string; votes: number; percentage: number }[]
}

export function VoteBarChart({ data }: VoteBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={data.length * 60 + 40}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 40, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 13 }} />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
          formatter={(value, name) => [value, name === "votes" ? "Suara" : name]}
        />
        <Bar dataKey="votes" fill="#2563eb" radius={[0, 4, 4, 0]} minPointSize={4}>
          <LabelList dataKey="votes" position="right" fontSize={13} fontWeight={600} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
