"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  ZAxis,
} from "recharts"
import type { PriceCorrelation } from "@/lib/price-service"

interface PriceCorrelationProps {
  correlations: PriceCorrelation[]
  onTimeframeChange?: (timeframe: string) => void
}

export function PriceCorrelation({ correlations, onTimeframeChange }: PriceCorrelationProps) {
  const [selectedToken, setSelectedToken] = useState<string>(
    correlations.length > 0 ? correlations[0].symbol.toLowerCase() : "btc",
  )
  const [timeframe, setTimeframe] = useState<string>("30")

  // Find the selected correlation data
  const selectedCorrelation = correlations.find((c) => c.symbol.toLowerCase() === selectedToken) || correlations[0]

  // Handle timeframe change
  const handleTimeframeChange = (value: string) => {
    setTimeframe(value)
    if (onTimeframeChange) {
      onTimeframeChange(value)
    }
  }

  // Format correlation value
  const formatCorrelation = (value: number) => {
    const percentage = Math.abs(value * 100).toFixed(1)
    const direction = value > 0 ? "positive" : value < 0 ? "negative" : "no"
    return `${percentage}% ${direction}`
  }

  // Get correlation color
  const getCorrelationColor = (value: number) => {
    if (value > 0.5) return "text-green-500"
    if (value > 0.2) return "text-green-400"
    if (value > 0) return "text-green-300"
    if (value > -0.2) return "text-red-300"
    if (value > -0.5) return "text-red-400"
    return "text-red-500"
  }

  // Normalize data for charts
  const normalizeData = (data: PriceCorrelation["dataPoints"]) => {
    if (!data || data.length === 0) return []

    // Find min and max values for price and sentiment
    const priceValues = data.map((d) => d.price)
    const sentimentValues = data.map((d) => d.sentiment)

    const minPrice = Math.min(...priceValues)
    const maxPrice = Math.max(...priceValues)
    const priceRange = maxPrice - minPrice

    const minSentiment = Math.min(...sentimentValues)
    const maxSentiment = Math.max(...sentimentValues)
    const sentimentRange = maxSentiment - minSentiment

    // Normalize values to 0-100 range
    return data.map((d) => ({
      ...d,
      normalizedPrice: priceRange === 0 ? 50 : ((d.price - minPrice) / priceRange) * 100,
      normalizedSentiment: sentimentRange === 0 ? 50 : ((d.sentiment - minSentiment) / sentimentRange) * 100,
    }))
  }

  const normalizedData = normalizeData(selectedCorrelation?.dataPoints || [])

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="px-4 py-3 border-b border-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Price & Sentiment Correlation</CardTitle>
            <CardDescription className="text-gray-400">
              Analyzing how sentiment correlates with price movements
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <Select value={selectedToken} onValueChange={setSelectedToken}>
              <SelectTrigger className="w-[120px] bg-gray-800 border-gray-700">
                <SelectValue placeholder="Select token" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {correlations.map((c) => (
                  <SelectItem key={c.symbol} value={c.symbol.toLowerCase()}>
                    {c.symbol.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={timeframe} onValueChange={handleTimeframeChange}>
              <SelectTrigger className="w-[120px] bg-gray-800 border-gray-700">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="overview">
          <TabsList className="grid grid-cols-3 bg-gray-800">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="chart">Chart</TabsTrigger>
            <TabsTrigger value="scatter">Correlation</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-800 p-4 rounded-md">
                <div className="text-sm text-gray-400 mb-1">Correlation</div>
                <div className="flex items-center">
                  <div
                    className={`text-2xl font-bold mr-2 ${getCorrelationColor(selectedCorrelation?.correlation || 0)}`}
                  >
                    {(selectedCorrelation?.correlation || 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-400">
                    ({formatCorrelation(selectedCorrelation?.correlation || 0)})
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Between {selectedCorrelation?.symbol} price and Twitter sentiment
                </div>
              </div>

              <div className="bg-gray-800 p-4 rounded-md">
                <div className="text-sm text-gray-400 mb-1">Interpretation</div>
                <div className="text-sm">
                  {selectedCorrelation?.correlation > 0.5 ? (
                    <span>Strong positive correlation: Price tends to move in the same direction as sentiment.</span>
                  ) : selectedCorrelation?.correlation > 0.2 ? (
                    <span>Moderate positive correlation: Price often moves in the same direction as sentiment.</span>
                  ) : selectedCorrelation?.correlation > -0.2 ? (
                    <span>Weak or no correlation: Price movements show little relationship with sentiment.</span>
                  ) : selectedCorrelation?.correlation > -0.5 ? (
                    <span>
                      Moderate negative correlation: Price often moves in the opposite direction of sentiment.
                    </span>
                  ) : (
                    <span>
                      Strong negative correlation: Price tends to move in the opposite direction of sentiment.
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={normalizedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    tickFormatter={(value) => {
                      const date = new Date(value)
                      return `${date.getMonth() + 1}/${date.getDate()}`
                    }}
                  />
                  <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "0.375rem" }}
                    itemStyle={{ color: "#e5e7eb" }}
                    labelStyle={{ color: "#e5e7eb", fontWeight: "bold" }}
                    formatter={(value, name) => [value, name === "normalizedPrice" ? "Price" : "Sentiment"]}
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="normalizedPrice"
                    name="Price"
                    stroke="#3b82f6"
                    dot={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="normalizedSentiment"
                    name="Sentiment"
                    stroke="#10b981"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="text-xs text-gray-500 mt-2">
              Note: Values are normalized to show relative changes. This chart shows how price and sentiment move
              relative to each other over time.
            </div>
          </TabsContent>

          <TabsContent value="chart" className="p-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={selectedCorrelation?.dataPoints || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    tickFormatter={(value) => {
                      const date = new Date(value)
                      return `${date.getMonth() + 1}/${date.getDate()}`
                    }}
                  />
                  <YAxis
                    yAxisId="price"
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    domain={["auto", "auto"]}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <YAxis yAxisId="sentiment" orientation="right" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "0.375rem" }}
                    itemStyle={{ color: "#e5e7eb" }}
                    labelStyle={{ color: "#e5e7eb", fontWeight: "bold" }}
                    formatter={(value, name) => {
                      if (name === "price") return [`$${Number(value).toLocaleString()}`, "Price"]
                      if (name === "sentiment") return [Number(value).toFixed(2), "Sentiment"]
                      if (name === "activity") return [Number(value).toLocaleString(), "Activity"]
                      return [value, name]
                    }}
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <Legend />
                  <Line yAxisId="price" type="monotone" dataKey="price" name="Price" stroke="#3b82f6" dot={false} />
                  <Line
                    yAxisId="sentiment"
                    type="monotone"
                    dataKey="sentiment"
                    name="Sentiment"
                    stroke="#10b981"
                    dot={false}
                  />
                  <Line
                    yAxisId="sentiment"
                    type="monotone"
                    dataKey="activity"
                    name="Activity"
                    stroke="#f59e0b"
                    dot={false}
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="scatter" className="p-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    type="number"
                    dataKey="sentiment"
                    name="Sentiment"
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    label={{ value: "Sentiment Score", position: "insideBottom", offset: -5, fill: "#9ca3af" }}
                  />
                  <YAxis
                    type="number"
                    dataKey="price"
                    name="Price"
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    label={{ value: "Price", angle: -90, position: "insideLeft", fill: "#9ca3af" }}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <ZAxis type="number" dataKey="activity" range={[20, 200]} name="Activity" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "0.375rem" }}
                    itemStyle={{ color: "#e5e7eb" }}
                    labelStyle={{ color: "#e5e7eb", fontWeight: "bold" }}
                    formatter={(value, name) => {
                      if (name === "Price") return [`$${Number(value).toLocaleString()}`, name]
                      if (name === "Sentiment") return [Number(value).toFixed(2), name]
                      if (name === "Activity") return [Number(value).toLocaleString(), name]
                      return [value, name]
                    }}
                    cursor={{ strokeDasharray: "3 3" }}
                  />
                  <Scatter name="Price vs Sentiment" data={selectedCorrelation?.dataPoints || []} fill="#3b82f6" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              This scatter plot shows the relationship between sentiment scores and price. Each point represents a day,
              and the size indicates activity level.
              {selectedCorrelation?.correlation !== 0 && (
                <div className="mt-1">
                  The correlation coefficient of {selectedCorrelation?.correlation.toFixed(2)} indicates a
                  {selectedCorrelation?.correlation > 0 ? " positive " : " negative "}
                  relationship between sentiment and price.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

