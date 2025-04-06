"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts"
import type { PriceData } from "@/lib/price-service"

interface TokenPriceCardProps {
  priceData: PriceData
  onClick?: () => void
}

export function TokenPriceCard({ priceData, onClick }: TokenPriceCardProps) {
  // Calculate price change
  const firstPrice = priceData.prices[0]?.price || 0
  const lastPrice = priceData.prices[priceData.prices.length - 1]?.price || 0
  const priceChange = lastPrice - firstPrice
  const priceChangePercent = firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0

  // Format price
  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    } else if (price >= 1) {
      return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
    } else {
      return `$${price.toLocaleString(undefined, { maximumFractionDigits: 4 })}`
    }
  }

  return (
    <Card
      className="bg-gray-900 border-gray-800 hover:bg-gray-800/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="px-4 py-3 border-b border-gray-800">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{priceData.symbol}</CardTitle>
            <CardDescription className="text-gray-400">{priceData.name}</CardDescription>
          </div>
          <Badge
            variant="outline"
            className={`${priceChangePercent >= 0 ? "bg-green-500/20 text-green-400 border-green-500/20" : "bg-red-500/20 text-red-400 border-red-500/20"}`}
          >
            {priceChangePercent >= 0 ? "+" : ""}
            {priceChangePercent.toFixed(2)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <div className="text-2xl font-bold">{formatPrice(lastPrice)}</div>
          <div className={`text-sm ${priceChangePercent >= 0 ? "text-green-400" : "text-red-400"}`}>
            {priceChangePercent >= 0 ? "+" : ""}
            {formatPrice(priceChange)}
          </div>
        </div>
        <div className="h-16">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={priceData.prices}>
              <Tooltip
                contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "0.375rem" }}
                itemStyle={{ color: "#e5e7eb" }}
                labelStyle={{ color: "#e5e7eb", fontWeight: "bold" }}
                formatter={(value) => [`$${Number(value).toLocaleString()}`, "Price"]}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke={priceChangePercent >= 0 ? "#10b981" : "#ef4444"}
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

