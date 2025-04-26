"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BarChart2, Users, TrendingUp, UserPlus, AlertTriangle, Bot } from "lucide-react"
import { TopInfluencers } from "../components/top-influencers"
import { CommunityDetection } from "../components/community-detection"
import { ConnectionRecommendations } from "../components/connection-recommendations"
import { TrendAnalysis } from "../components/trend-analysis"
import {
  detectCommunities,
  recommendConnections,
  analyzeTrends,
  findTopInfluencers,
} from "@/lib/analytics-service"
import { generateTradingSignals } from "@/lib/signal-generation-service"
import { TradingSignalsDisplay } from "../components/trading-signals-display"
import type { GraphData } from "@/types/twitter"
import type { NodeAnalytics, CommunityInfo, RecommendedConnection, TimeframeData } from "@/lib/analytics-service"
import type { TradingSignal } from "@/types/signals"
import { Skeleton } from "@/components/ui/skeleton"
import { getSampleGraphData } from "@/lib/sample-data"

export default function AnalyticsPage() {
  const router = useRouter()
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [analytics, setAnalytics] = useState<NodeAnalytics[] | null>(null)
  const [communities, setCommunities] = useState<CommunityInfo[] | null>(null)
  const [recommendations, setRecommendations] = useState<RecommendedConnection[] | null>(null)
  const [trendData, setTrendData] = useState<{ day: TimeframeData[], week: TimeframeData[], month: TimeframeData[] } | null>(null)
  const [tradingSignals, setTradingSignals] = useState<TradingSignal[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      let currentAnalytics: NodeAnalytics[] = []

      try {
        const currentGraphData = graphData || getSampleGraphData("sample")
        setGraphData(currentGraphData)

        const communityResult = await detectCommunities(currentGraphData)
        setCommunities(communityResult.communities)
        setAnalytics(communityResult.nodeAnalytics)
        currentAnalytics = communityResult.nodeAnalytics

        const connectionRecs = await recommendConnections(currentGraphData, currentAnalytics)
        setRecommendations(connectionRecs)

        const dailyTrends = await analyzeTrends(currentGraphData, 'day')
        const weeklyTrends = await analyzeTrends(currentGraphData, 'week')
        const monthlyTrends = await analyzeTrends(currentGraphData, 'month')
        setTrendData({ day: dailyTrends, week: weeklyTrends, month: monthlyTrends })

        const signals = await generateTradingSignals(currentGraphData)
        setTradingSignals(signals)

      } catch (err: any) {
        console.error("Error loading analytics data:", err)
        if (err.message && err.message.includes('is not defined')) {
          setError(`Function not found: ${err.message}. Please check imports in lib/analytics-service.ts.`)
        } else {
          setError(err instanceof Error ? err.message : "Failed to load analytics data")
        }

        setAnalytics([])
        setCommunities([])
        setRecommendations([])
        setTrendData({ day: [], week: [], month: [] })
        setTradingSignals([{
          id: 'error-signal',
          timestamp: Date.now(),
          type: 'NEUTRAL',
          source: 'System Error',
          strength: 0,
          reason: `Failed to load analytics data: ${err instanceof Error ? err.message : "Unknown error"}`,
        }])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <main className="container mx-auto px-4 py-8">
      <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <h1 className="text-3xl font-bold mb-2">Network Analytics</h1>
      <p className="text-muted-foreground mb-8">
        Insights into user interactions, community structures, and trends.
        {graphData?.nodes?.length ? ` Analyzing ${graphData.nodes.length} users and ${graphData.links.length} connections.` : ""}
      </p>

      {isLoading && (
        <div className="space-y-6">
          <Skeleton className="h-12 w-1/4" />
          <Skeleton className="h-8 w-3/4 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[400px] w-full" />
            <Skeleton className="h-[400px] w-full" />
            <Skeleton className="h-[400px] w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      )}

      {error && (
         <Card className="border-destructive bg-destructive/10">
           <CardHeader>
             <CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle /> Error Loading Data</CardTitle>
           </CardHeader>
           <CardContent>
             <p>{error}</p>
             <p className="mt-2 text-sm text-muted-foreground">Some components might not display correctly.</p>
           </CardContent>
         </Card>
      )}

      {!isLoading && !error && analytics && communities && recommendations && trendData && tradingSignals && (
        <>
          <div className="mb-8">
             <TradingSignalsDisplay signals={tradingSignals} />
          </div>

          <Tabs defaultValue="overview" className="mb-8">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-4">
              <TabsTrigger value="overview"><BarChart2 className="mr-2 h-4 w-4" />Overview</TabsTrigger>
              <TabsTrigger value="communities"><Users className="mr-2 h-4 w-4" />Communities</TabsTrigger>
              <TabsTrigger value="trends"><TrendingUp className="mr-2 h-4 w-4" />Trends</TabsTrigger>
              <TabsTrigger value="connections"><UserPlus className="mr-2 h-4 w-4" />Connections</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TopInfluencers influencers={analytics} />
                 <Card>
                    <CardHeader>
                        <CardTitle>Analytics Summary</CardTitle>
                        <CardDescription>Key metrics from the network.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Total Users: {graphData?.nodes?.length ?? 'N/A'}</p>
                        <p>Total Connections: {graphData?.links?.length ?? 'N/A'}</p>
                        <p>Detected Communities: {communities?.length ?? 'N/A'}</p>
                    </CardContent>
                 </Card>
              </div>
            </TabsContent>

            <TabsContent value="communities">
              <CommunityDetection communities={communities} />
            </TabsContent>

            <TabsContent value="trends">
              <TrendAnalysis trends={trendData} />
            </TabsContent>

            <TabsContent value="connections">
              <ConnectionRecommendations recommendations={recommendations} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </main>
  )
}

function getBackgroundColorForGroup(group: string): string {
  switch (group) {
    case "seed":
      return "bg-rose-500"
    case "influencer":
      return "bg-emerald-500"
    case "project":
      return "bg-blue-500"
    case "exchange":
      return "bg-yellow-500"
    case "media":
      return "bg-purple-500"
    case "investor":
      return "bg-orange-500"
    case "developer":
      return "bg-teal-500"
    case "community":
      return "bg-pink-500"
    case "other":
      return "bg-gray-500"
    case "kol":
      return "bg-cyan-500"
    default:
      return "bg-gray-500"
  }
}

