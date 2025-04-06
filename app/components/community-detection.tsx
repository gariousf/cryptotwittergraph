"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import type { CommunityInfo } from "@/lib/analytics-service"
import { getInitials, formatNumber, getBackgroundColorForGroup, getTextColorForGroup } from "@/lib/ui-helpers"

interface CommunityDetectionProps {
  communities: CommunityInfo[]
  onSelectNode?: (nodeId: string) => void
}

export function CommunityDetection({ communities, onSelectNode }: CommunityDetectionProps) {
  const [selectedCommunity, setSelectedCommunity] = useState<number | null>(
    communities.length > 0 ? communities[0].id : null,
  )

  // Colors for the communities
  const communityColors = [
    "#3b82f6", // blue-500
    "#10b981", // emerald-500
    "#f59e0b", // amber-500
    "#8b5cf6", // purple-500
    "#ec4899", // pink-500
    "#06b6d4", // cyan-500
    "#ef4444", // red-500
    "#84cc16", // lime-500
    "#14b8a6", // teal-500
    "#f97316", // orange-500
  ]

  // Data for the pie chart
  const pieData = communities.map((community, index) => ({
    name: `Community ${community.id}`,
    value: community.size,
    color: communityColors[index % communityColors.length],
  }))

  // Get the selected community
  const community = communities.find((c) => c.id === selectedCommunity)

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="px-4 py-3 border-b border-gray-800">
        <CardTitle>Community Detection</CardTitle>
        <CardDescription className="text-gray-400">Using Louvain algorithm</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="overview">
          <TabsList className="grid grid-cols-2 bg-gray-800">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="p-4">
            <div className="mb-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "0.375rem" }}
                    itemStyle={{ color: "#e5e7eb" }}
                    labelStyle={{ color: "#e5e7eb", fontWeight: "bold" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {communities.map((community, index) => (
                <div
                  key={community.id}
                  className={`flex items-center gap-3 p-2 rounded-md hover:bg-gray-800 cursor-pointer ${selectedCommunity === community.id ? "bg-gray-800" : ""}`}
                  onClick={() => setSelectedCommunity(community.id)}
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: communityColors[index % communityColors.length] }}
                  ></div>
                  <div>
                    <div className="font-medium">Community {community.id}</div>
                    <div className="text-xs text-gray-400">
                      {community.size} members, {community.dominantGroup}
                    </div>
                  </div>
                  <div className="ml-auto text-sm font-medium">{formatNumber(community.avgFollowers)} avg</div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="details" className="p-4">
            {community ? (
              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-medium">Community {community.id}</h3>
                  <p className="text-sm text-gray-400">
                    {community.size} members, predominantly {community.dominantGroup}
                  </p>
                  <p className="text-sm text-gray-400">Average followers: {formatNumber(community.avgFollowers)}</p>
                </div>

                <h4 className="text-sm font-medium mb-2">Top Members</h4>
                <div className="space-y-3">
                  {community.topNodes.map((node) => (
                    <div
                      key={node.id}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-800 cursor-pointer"
                      onClick={() => onSelectNode?.(node.id)}
                    >
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
                        <span className="text-sm font-medium mt-1">{formatNumber(node.followers)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-400">Select a community to view details</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

