"use client"

import type React from "react"

import { useState, useEffect } from "react"
// Add the Smile icon import
import { Search, Filter, Zap, AlertTriangle, BarChart2, Smile } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ForceGraph } from "./components/force-graph"
import { VisualizationControls } from "./components/visualization-controls"
import { fetchTwitterGraph } from "./actions"
import type { GraphData, GraphNode, GraphLink, ConnectionType } from "@/types/twitter"
import type { LayoutType, NodeSizeMetric, NodeColorScheme } from "./components/force-graph"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [connectionDepth, setConnectionDepth] = useState([1])
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] })
  const [loading, setLoading] = useState(false)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [usingSampleData, setUsingSampleData] = useState(false)

  // Visualization options
  const [layout, setLayout] = useState<LayoutType>("force")
  const [nodeSizeMetric, setNodeSizeMetric] = useState<NodeSizeMetric>("followers")
  const [nodeColorScheme, setNodeColorScheme] = useState<NodeColorScheme>("group")

  // Function to load graph data
  const loadGraphData = async (username: string, depth: number) => {
    if (!username) return

    setLoading(true)
    setError(null)

    try {
      const { data, usingSampleData } = await fetchTwitterGraph(username, depth)
      setGraphData(data)
      setUsingSampleData(usingSampleData)

      // Select the seed node if available
      if (data.nodes.length > 0) {
        const seedNode = data.nodes.find((node) => node.group === "seed")
        setSelectedNode(seedNode || data.nodes[0])
      }
    } catch (err) {
      console.error("Error loading graph data:", err)
      setError("Failed to load Twitter data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery) {
      loadGraphData(searchQuery, connectionDepth[0])
    }
  }

  // Handle node click
  const handleNodeClick = (nodeId: string) => {
    const node = graphData.nodes.find((n) => n.id === nodeId)
    if (node) {
      setSelectedNode(node)
    }
  }

  // Get connections for the selected node
  const getNodeConnections = () => {
    if (!selectedNode || !graphData.links.length) return []

    const connections: Array<GraphLink & { node: GraphNode }> = []
    const nodeMap = new Map(graphData.nodes.map((node) => [node.id, node]))

    // Find all links where the selected node is source or target
    graphData.links.forEach((link) => {
      if (link.source === selectedNode.id || (typeof link.source === "object" && link.source.id === selectedNode.id)) {
        // Find the target node
        const targetId = typeof link.target === "object" ? link.target.id : link.target
        const targetNode = nodeMap.get(targetId)

        if (targetNode) {
          connections.push({
            ...link,
            node: targetNode,
            // Ensure source is a string for consistent handling
            source: typeof link.source === "object" ? link.source.id : link.source,
          })
        }
      } else if (
        link.target === selectedNode.id ||
        (typeof link.target === "object" && link.target.id === selectedNode.id)
      ) {
        // Find the source node
        const sourceId = typeof link.source === "object" ? link.source.id : link.source
        const sourceNode = nodeMap.get(sourceId)

        if (sourceNode) {
          connections.push({
            ...link,
            node: sourceNode,
            // Ensure source is a string for consistent handling
            source: typeof link.source === "object" ? link.source.id : link.source,
          })
        }
      }
    })

    return connections
  }

  // Load initial data with a default crypto Twitter account
  useEffect(() => {
    loadGraphData("VitalikButerin", connectionDepth[0])
  }, [])

  // Update graph when depth changes
  useEffect(() => {
    if (searchQuery) {
      loadGraphData(searchQuery, connectionDepth[0])
    }
  }, [connectionDepth])

  return (
    <main className="flex min-h-screen flex-col bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mr-4">
            <Zap className="h-6 w-6 text-emerald-400" />
            <h1 className="text-xl font-bold">CryptoGraph</h1>
          </div>
          <form onSubmit={handleSearch} className="relative flex-1 max-w-md flex">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search by Twitter handle..."
                className="pl-8 bg-gray-800 border-gray-700 text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit" variant="default" size="sm" className="ml-2">
              Search
            </Button>
          </form>
          <Button
            variant="outline"
            size="icon"
            className="ml-2 border-gray-700 text-gray-400"
            onClick={() => router.push("/analytics")}
          >
            <BarChart2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="ml-2 border-gray-700 text-gray-400"
            onClick={() => router.push("/sentiment")}
          >
            <Smile className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="ml-2 border-gray-700 text-gray-400">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="container grid flex-1 gap-4 p-4 sm:p-6 lg:p-8 md:grid-cols-3">
        {usingSampleData && (
          <div className="md:col-span-3 mb-2">
            <Alert variant="warning" className="bg-amber-950/50 border-amber-800 text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Using sample data because Twitter API authentication failed. Check your API credentials.
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="md:col-span-2">
          <Card className="bg-gray-900 border-gray-800 overflow-hidden">
            <CardHeader className="border-b border-gray-800 px-4 py-3">
              <CardTitle>Network Visualization</CardTitle>
              <CardDescription className="text-gray-400">
                {graphData.nodes.length
                  ? `Showing ${graphData.nodes.length} accounts and ${graphData.links.length} connections`
                  : "Search for a Twitter handle to visualize their network"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 aspect-square relative">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading Twitter data...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-4">
                    <p className="text-red-400 mb-2">{error}</p>
                    <Button variant="outline" onClick={() => loadGraphData("VitalikButerin", connectionDepth[0])}>
                      Load Default Data
                    </Button>
                  </div>
                </div>
              ) : graphData.nodes.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-4">
                    <p className="text-gray-400 mb-2">
                      No data available. Search for a Twitter handle to visualize their network.
                    </p>
                  </div>
                </div>
              ) : (
                <ForceGraph
                  data={graphData}
                  onNodeClick={handleNodeClick}
                  layout={layout}
                  nodeSizeMetric={nodeSizeMetric}
                  nodeColorScheme={nodeColorScheme}
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="px-4 py-3">
              <CardTitle>Graph Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Connection Depth</span>
                    <span className="text-sm text-gray-400">{connectionDepth[0]}</span>
                  </div>
                  <Slider
                    value={connectionDepth}
                    min={1}
                    max={2} // Limiting to 2 to avoid rate limits
                    step={1}
                    onValueChange={setConnectionDepth}
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Higher depth values will show more connections but take longer to load.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <VisualizationControls
            layout={layout}
            nodeSizeMetric={nodeSizeMetric}
            nodeColorScheme={nodeColorScheme}
            onLayoutChange={setLayout}
            onNodeSizeMetricChange={setNodeSizeMetric}
            onNodeColorSchemeChange={setNodeColorScheme}
          />

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="px-4 py-3 border-b border-gray-800">
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="profile">
                <TabsList className="grid grid-cols-2 bg-gray-800">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="connections">Connections</TabsTrigger>
                </TabsList>
                <TabsContent value="profile" className="p-4">
                  {loading ? (
                    <div className="flex items-start gap-4">
                      <Skeleton className="h-16 w-16 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                        <div className="mt-2 flex gap-3">
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    </div>
                  ) : selectedNode ? (
                    <div className="flex items-start gap-4">
                      <Avatar className={`h-16 w-16 border-2 ${getBorderColorForGroup(selectedNode.group)}`}>
                        {selectedNode.imageUrl ? (
                          <AvatarImage src={selectedNode.imageUrl} />
                        ) : (
                          <AvatarFallback
                            className={`${getBackgroundColorForGroup(selectedNode.group)} ${getTextColorForGroup(selectedNode.group)}`}
                          >
                            {getInitials(selectedNode.name)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold">{selectedNode.name}</h3>
                          {selectedNode.group === "kol" && (
                            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/20">KOL</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">@{selectedNode.username}</p>
                        <div className="mt-2 flex gap-3 text-sm text-gray-400">
                          <div>
                            <span className="font-medium text-white">{formatNumber(selectedNode.followers)}</span>{" "}
                            Followers
                          </div>
                          {selectedNode.kolRank && (
                            <div>
                              <span className="font-medium text-cyan-400">Rank: {selectedNode.kolRank}/100</span>
                            </div>
                          )}
                        </div>
                        {selectedNode.description && (
                          <p className="mt-2 text-sm text-gray-300 line-clamp-3">{selectedNode.description}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400">Select a node to view details</p>
                  )}
                </TabsContent>
                <TabsContent value="connections" className="p-4">
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div>
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-16 mt-1" />
                          </div>
                          <Skeleton className="h-5 w-16 ml-auto" />
                        </div>
                      ))}
                    </div>
                  ) : selectedNode ? (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {getNodeConnections().length > 0 ? (
                        getNodeConnections().map((connection) => (
                          <div
                            key={`${connection.source}-${connection.target}-${connection.type}`}
                            className="flex items-center gap-3"
                          >
                            <Avatar className={`h-8 w-8 border ${getBorderColorForGroup(connection.node.group)}`}>
                              {connection.node.imageUrl ? (
                                <AvatarImage src={connection.node.imageUrl} />
                              ) : (
                                <AvatarFallback
                                  className={`${getBackgroundColorForGroup(connection.node.group)} ${getTextColorForGroup(connection.node.group)}`}
                                >
                                  {getInitials(connection.node.name)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <div className="font-medium">{connection.node.name}</div>
                              <div className="text-xs text-gray-400">@{connection.node.username}</div>
                            </div>
                            <div className="ml-auto flex flex-col items-end">
                              <Badge
                                className="mb-1"
                                style={{
                                  backgroundColor: getBackgroundColorForGroup(connection.node.group),
                                  color: getTextColorForGroup(connection.node.group),
                                }}
                              >
                                {capitalizeFirstLetter(connection.node.group)}
                              </Badge>
                              <Badge variant="outline" className={getConnectionTypeBadgeClass(connection.type)}>
                                {getConnectionTypeLabel(connection.type)}
                                {connection.count && connection.count > 1 ? ` (${connection.count})` : ""}
                              </Badge>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400">No connections found</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-400">Select a node to view connections</p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

// Helper functions for styling
function getBorderColorForGroup(group: string): string {
  switch (group) {
    case "seed":
      return "border-rose-500/50"
    case "influencer":
      return "border-emerald-500/50"
    case "project":
      return "border-blue-500/50"
    case "dao":
      return "border-purple-500/50"
    case "investor":
      return "border-amber-500/50"
    case "company":
      return "border-indigo-500/50"
    case "kol":
      return "border-cyan-500/50"
    default:
      return "border-gray-500/50"
  }
}

function getBackgroundColorForGroup(group: string): string {
  switch (group) {
    case "seed":
      return "bg-rose-500/20"
    case "influencer":
      return "bg-emerald-500/20"
    case "project":
      return "bg-blue-500/20"
    case "dao":
      return "bg-purple-500/20"
    case "investor":
      return "bg-amber-500/20"
    case "company":
      return "bg-indigo-500/20"
    case "kol":
      return "bg-cyan-500/20"
    default:
      return "bg-gray-500/20"
  }
}

function getTextColorForGroup(group: string): string {
  switch (group) {
    case "seed":
      return "text-rose-400"
    case "influencer":
      return "text-emerald-400"
    case "project":
      return "text-blue-400"
    case "dao":
      return "text-purple-400"
    case "investor":
      return "text-amber-400"
    case "company":
      return "text-indigo-400"
    case "kol":
      return "text-cyan-400"
    default:
      return "text-gray-400"
  }
}

// Helper functions for connection types
function getConnectionTypeLabel(type: ConnectionType): string {
  switch (type) {
    case "follows":
      return "Follows"
    case "mentioned":
      return "Mentions"
    case "retweeted":
      return "Retweets"
    case "quoted":
      return "Quotes"
    case "replied":
      return "Replies"
    default:
      return capitalizeFirstLetter(type)
  }
}

function getConnectionTypeBadgeClass(type: ConnectionType): string {
  switch (type) {
    case "follows":
      return "bg-gray-700/20 text-gray-400 border-gray-700/20"
    case "mentioned":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
    case "retweeted":
      return "bg-blue-500/20 text-blue-400 border-blue-500/20"
    case "quoted":
      return "bg-purple-500/20 text-purple-400 border-purple-500/20"
    case "replied":
      return "bg-pink-500/20 text-pink-400 border-pink-500/20"
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/20"
  }
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M"
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K"
  }
  return num.toString()
}

function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

