"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BarChart2, Users, TrendingUp, UserPlus } from "lucide-react"
import { TopInfluencers } from "../components/top-influencers"
import { CommunityDetection } from "../components/community-detection"
import { TrendAnalysis } from "../components/trend-analysis"
import { ConnectionRecommendations } from "../components/connection-recommendations"
import { fetchTwitterGraph } from "../actions"
import {
  getTopInfluencers,
  detectCommunities,
  analyzeTrends,
  recommendConnections,
  type NodeAnalytics,
  type CommunityInfo,
  type TimeframeData,
  type RecommendedConnection,
} from "@/lib/analytics-service"
import type { GraphData, GraphNode } from "@/types/twitter"

export default function AnalyticsPage() {
  const router = useRouter()
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] })
  const [loading, setLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)

  // Analytics state
  const [topInfluencers, setTopInfluencers] = useState<NodeAnalytics[]>([])
  const [communities, setCommunities] = useState<CommunityInfo[]>([])
  const [trends, setTrends] = useState<{
    day: TimeframeData[]
    week: TimeframeData[]
    month: TimeframeData[]
  }>({
    day: [],
    week: [],
    month: [],
  })
  const [recommendations, setRecommendations] = useState<RecommendedConnection[]>([])

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const { data } = await fetchTwitterGraph("VitalikButerin", 2)
        setGraphData(data)

        // Process analytics
        const influencers = getTopInfluencers(data, "followers", 20)
        setTopInfluencers(influencers)

        const { communities } = detectCommunities(data)
        setCommunities(communities)

        const dayTrends = analyzeTrends(data, "day")
        const weekTrends = analyzeTrends(data, "week")
        const monthTrends = analyzeTrends(data, "month")
        setTrends({
          day: dayTrends,
          week: weekTrends,
          month: monthTrends,
        })

        // Set the selected node to the seed node or first node
        const seedNode = data.nodes.find((node) => node.group === "seed")
        if (seedNode) {
          setSelectedNode(seedNode)
          const nodeRecommendations = recommendConnections(data, seedNode.id, 3)
          setRecommendations(nodeRecommendations)
        }
      } catch (error) {
        console.error("Error loading data for analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Handle node selection
  const handleNodeSelect = (nodeId: string) => {
    const node = graphData.nodes.find((n) => n.id === nodeId)
    if (node) {
      setSelectedNode(node)
      const nodeRecommendations = recommendConnections(graphData, nodeId, 3)
      setRecommendations(nodeRecommendations)
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-gray-950 text-white">
      <div className="container p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            className="border-gray-700 text-gray-400"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Network Analytics</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading analytics data...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-6 mb-6 md:grid-cols-4">
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="bg-blue-500/20 p-3 rounded-full">
                    <Users className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total Accounts</p>
                    <h3 className="text-2xl font-bold">{graphData.nodes.length}</h3>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="bg-emerald-500/20 p-3 rounded-full">
                    <BarChart2 className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Connections</p>
                    <h3 className="text-2xl font-bold">{graphData.links.length}</h3>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="bg-purple-500/20 p-3 rounded-full">
                    <Users className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Communities</p>
                    <h3 className="text-2xl font-bold">{communities.length}</h3>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="bg-amber-500/20 p-3 rounded-full">
                    <TrendingUp className="h-6 w-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Engagement</p>
                    <h3 className="text-2xl font-bold">
                      {topInfluencers.reduce((sum, node) => sum + node.engagement, 0)}
                    </h3>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="influencers" className="mb-6">
              <TabsList className="bg-gray-800 mb-4">
                <TabsTrigger value="influencers" className="data-[state=active]:bg-gray-700">
                  <BarChart2 className="h-4 w-4 mr-2" />
                  Top Influencers
                </TabsTrigger>
                <TabsTrigger value="communities" className="data-[state=active]:bg-gray-700">
                  <Users className="h-4 w-4 mr-2" />
                  Communities
                </TabsTrigger>
                <TabsTrigger value="trends" className="data-[state=active]:bg-gray-700">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Trends
                </TabsTrigger>
                <TabsTrigger value="recommendations" className="data-[state=active]:bg-gray-700">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Recommendations
                </TabsTrigger>
              </TabsList>

              <TabsContent value="influencers">
                <TopInfluencers influencers={topInfluencers} onSelectNode={handleNodeSelect} />
              </TabsContent>

              <TabsContent value="communities">
                <CommunityDetection communities={communities} onSelectNode={handleNodeSelect} />
              </TabsContent>

              <TabsContent value="trends">
                <TrendAnalysis trends={trends} />
              </TabsContent>

              <TabsContent value="recommendations">
                {selectedNode ? (
                  <div className="space-y-4">
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader className="px-4 py-3 border-b border-gray-800">
                        <CardTitle>Selected Account</CardTitle>
                        <CardDescription className="text-gray-400">
                          Recommendations are based on this account
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-3 h-3 rounded-full ${getBackgroundColorForGroup(selectedNode.group)}`}
                          ></div>
                          <div className="font-medium">{selectedNode.name}</div>
                          <div className="text-sm text-gray-400">@{selectedNode.username}</div>
                        </div>
                      </CardContent>
                    </Card>

                    <ConnectionRecommendations recommendations={recommendations} onSelectNode={handleNodeSelect} />
                  </div>
                ) : (
                  <Card className="bg-gray-900 border-gray-800">
                    <CardContent className="p-6 text-center text-gray-400">
                      Select a node to view recommendations
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </main>
  )
}

// Helper function for styling
function getBackgroundColorForGroup(group: string): string {
  switch (group) {
    case "seed":
      return "bg-rose-500"
    case "influencer":
      return "bg-emerald-500"
    case "project":
      return "bg-blue-500"
    case "dao":
      return "bg-purple-500"
    case "investor":
      return "bg-amber-500"
    case "company":
      return "bg-indigo-500"
    case "kol":
      return "bg-cyan-500"
    default:
      return "bg-gray-500"
  }
}

