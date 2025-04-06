"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import type { NodeAnalytics } from "@/lib/analytics-service"
import { getInitials, formatNumber, getBackgroundColorForGroup, getTextColorForGroup } from "@/lib/ui-helpers"

interface TopInfluencersProps {
  influencers: NodeAnalytics[]
  onSelectNode?: (nodeId: string) => void
}

export function TopInfluencers({ influencers, onSelectNode }: TopInfluencersProps) {
  const [metric, setMetric] = useState<"followers" | "engagement" | "degreeCentrality">("followers")

  const metricLabels = {
    followers: "Followers",
    engagement: "Engagement",
    degreeCentrality: "Connections",
  }

  const chartData = influencers
    .map((node) => ({
      name: node.username,
      value: node[metric],
      group: node.group,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="px-4 py-3 border-b border-gray-800">
        <CardTitle>Top Influencers</CardTitle>
        <CardDescription className="text-gray-400">Ranked by different metrics</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="followers" onValueChange={(value) => setMetric(value as any)}>
          <TabsList className="grid grid-cols-3 bg-gray-800">
            <TabsTrigger value="followers">Followers</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="degreeCentrality">Connections</TabsTrigger>
          </TabsList>

          <TabsContent value={metric} className="p-4">
            <div className="mb-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "0.375rem" }}
                    itemStyle={{ color: "#e5e7eb" }}
                    labelStyle={{ color: "#e5e7eb", fontWeight: "bold" }}
                  />
                  <Bar dataKey="value" name={metricLabels[metric]} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {influencers
                .sort((a, b) => b[metric] - a[metric])
                .slice(0, 10)
                .map((node, index) => (
                  <div
                    key={node.id}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-800 cursor-pointer"
                    onClick={() => onSelectNode?.(node.id)}
                  >
                    <div className="text-gray-500 font-mono w-5 text-right">{index + 1}</div>
                    <Avatar
                      className={`h-8 w-8 border border-${node.group === "kol" ? "cyan" : node.group === "project" ? "blue" : "gray"}-500/50`}
                    >
                      {node.imageUrl ? (
                        <AvatarImage src={node.imageUrl} />
                      ) : (
                        <AvatarFallback
                          className={`${getBackgroundColorForGroup(node.group)} ${getTextColorForGroup(node.group)}`}
                        >
                          {getInitials(node.name)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <div className="font-medium">{node.name}</div>
                      <div className="text-xs text-gray-400">@{node.username}</div>
                    </div>
                    <div className="ml-auto flex flex-col items-end">
                      <Badge
                        variant="outline"
                        className={`${getBackgroundColorForGroup(node.group)} ${getTextColorForGroup(node.group)}`}
                      >
                        {node.group === "kol" ? "KOL" : node.group.charAt(0).toUpperCase() + node.group.slice(1)}
                      </Badge>
                      <span className="text-sm font-medium mt-1">
                        {metric === "followers"
                          ? formatNumber(node.followers)
                          : metric === "engagement"
                            ? node.engagement.toFixed(1)
                            : node.degreeCentrality}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

