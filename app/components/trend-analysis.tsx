"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { TimeframeData } from "@/lib/analytics-service"

interface TrendAnalysisProps {
  trends: {
    day: TimeframeData[]
    week: TimeframeData[]
    month: TimeframeData[]
  }
}

export function TrendAnalysis({ trends }: TrendAnalysisProps) {
  const [timeframe, setTimeframe] = useState<"day" | "week" | "month">("week")

  // Format the timestamp based on the timeframe
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)

    if (timeframe === "day") {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (timeframe === "week") {
      return date.toLocaleDateString([], { weekday: "short" })
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }

  const data = trends[timeframe].map((item) => ({
    ...item,
    formattedTime: formatTimestamp(item.timestamp),
  }))

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="px-4 py-3 border-b border-gray-800">
        <CardTitle>Trend Analysis</CardTitle>
        <CardDescription className="text-gray-400">Activity over time</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="week" onValueChange={(value) => setTimeframe(value as "day" | "week" | "month")}>
          <TabsList className="grid grid-cols-3 bg-gray-800">
            <TabsTrigger value="day">24 Hours</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>

          <TabsContent value={timeframe} className="p-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="formattedTime" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "0.375rem" }}
                    itemStyle={{ color: "#e5e7eb" }}
                    labelStyle={{ color: "#e5e7eb", fontWeight: "bold" }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="interactions"
                    name="Interactions"
                    stroke="#3b82f6"
                    activeDot={{ r: 8 }}
                  />
                  <Line yAxisId="right" type="monotone" dataKey="newNodes" name="New Accounts" stroke="#10b981" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-gray-800 p-3 rounded-md">
                <div className="text-sm text-gray-400">Total Interactions</div>
                <div className="text-2xl font-bold text-blue-400">
                  {data.reduce((sum, item) => sum + item.interactions, 0)}
                </div>
              </div>
              <div className="bg-gray-800 p-3 rounded-md">
                <div className="text-sm text-gray-400">New Accounts</div>
                <div className="text-2xl font-bold text-emerald-400">
                  {data.reduce((sum, item) => sum + item.newNodes, 0)}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

