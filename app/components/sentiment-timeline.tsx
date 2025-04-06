"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { getSentimentColor } from "@/lib/sentiment-utils"

interface SentimentTimelineProps {
  data: Array<{
    date: string
    sentiment: number
    tweets: number
  }>
  height?: number
}

export function SentimentTimeline({ data, height = 300 }: SentimentTimelineProps) {
  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  // Get color based on sentiment score
  const getLineColor = (score: number) => {
    if (score <= -5) return getSentimentColor("very-negative")
    if (score < -1) return getSentimentColor("negative")
    if (score <= 1) return getSentimentColor("neutral")
    if (score <= 5) return getSentimentColor("positive")
    return getSentimentColor("very-positive")
  }

  // Format data for chart
  const chartData = data.map(item => ({
    ...item,
    date: formatDate(item.date),
    color: getLineColor(item.sentiment)
  }))

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="date" 
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af' }}
          />
          <YAxis 
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af' }}
            label={{ 
              value: 'Sentiment Score', 
              angle: -90, 
              position: 'insideLeft',
              style: { fill: '#9ca3af' }
            }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "0.375rem" }}
            itemStyle={{ color: "#e5e7eb" }}
            formatter={(value: number, name: string) => {
              if (name === 'sentiment') return [value.toFixed(2), 'Sentiment Score']
              if (name === 'tweets') return [value, 'Tweet Count']
              return [value, name]
            }}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="sentiment"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 2 }}
            activeDot={{ r: 6, strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="tweets"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 2 }}
            activeDot={{ r: 6, strokeWidth: 2 }}
            yAxisId={1}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
} 