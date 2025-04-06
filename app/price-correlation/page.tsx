"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, AlertTriangle } from "lucide-react"
import { PriceCorrelation } from "../components/price-correlation"
import { TokenPriceCard } from "../components/token-price-card"
import { fetchTwitterGraph } from "../actions"
import { getUserTweets } from "@/lib/twitter-api"
import { analyzeTweetsSentiment } from "@/lib/sentiment-service"
import { getCryptoPrice, mapUsernameToCryptoSymbols, calculatePriceCorrelation } from "@/lib/price-service"
import type { GraphData, TwitterTweet } from "@/types/twitter"
import type { PriceData, PriceCorrelation as PriceCorrelationType } from "@/lib/price-service"

export default function PriceCorrelationPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] })
  const [tweets, setTweets] = useState<(TwitterTweet & { sentiment: any })[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usingSampleData, setUsingSampleData] = useState(false)
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState<string>("30")

  // Price data states
  const [priceData, setPriceData] = useState<Record<string, PriceData>>({})
  const [correlations, setCorrelations] = useState<PriceCorrelationType[]>([])

  // Load initial data
  useEffect(() => {
    loadData("VitalikButerin")
  }, [])

  // Function to load data
  const loadData = async (username: string) => {
    if (!username) return

    setLoading(true)
    setError(null)

    try {
      // Fetch graph data
      const { data, usingSampleData } = await fetchTwitterGraph(username, 1)
      setGraphData(data)
      setUsingSampleData(usingSampleData)

      // Find the seed node
      const seedNode = data.nodes.find((node) => node.group === "seed")
      if (seedNode) {
        setSelectedUsername(seedNode.username)

        // Fetch tweets for sentiment analysis
        const userTweets = await getUserTweets(seedNode.id)
        if (userTweets.length > 0) {
          const { tweets: analyzedTweets } = analyzeTweetsSentiment(userTweets)
          setTweets(analyzedTweets)

          // Map username to crypto symbols
          const cryptoSymbols = mapUsernameToCryptoSymbols(seedNode.username)

          // Fetch price data for each symbol
          const days = Number.parseInt(timeframe, 10)
          const prices: Record<string, PriceData> = {}

          for (const symbol of cryptoSymbols) {
            const price = await getCryptoPrice(symbol, days)
            if (price) {
              prices[symbol] = price
            }
          }

          setPriceData(prices)

          // Calculate correlations
          const sentimentData = processSentimentData(analyzedTweets)
          const newCorrelations: PriceCorrelationType[] = []

          for (const symbol of Object.keys(prices)) {
            const correlation = calculatePriceCorrelation(prices[symbol], sentimentData)
            newCorrelations.push(correlation)
          }

          setCorrelations(newCorrelations)
        } else {
          setTweets([])
          setPriceData({})
          setCorrelations([])
        }
      }
    } catch (err) {
      console.error("Error loading data:", err)
      setError("Failed to load data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Process sentiment data for correlation analysis
  const processSentimentData = (tweets: any[]) => {
    // Group tweets by day
    const tweetsByDay = new Map<string, { scores: number[]; activities: number[] }>()

    tweets.forEach((tweet) => {
      if (!tweet.sentiment) return

      const date = new Date(tweet.created_at)
      const dateStr = date.toISOString().split("T")[0]

      if (!tweetsByDay.has(dateStr)) {
        tweetsByDay.set(dateStr, { scores: [], activities: [] })
      }

      const dayData = tweetsByDay.get(dateStr)!
      dayData.scores.push(tweet.sentiment.score)

      // Calculate activity based on engagement metrics
      const activity = tweet.public_metrics
        ? tweet.public_metrics.retweet_count + tweet.public_metrics.reply_count + tweet.public_metrics.like_count
        : 1

      dayData.activities.push(activity)
    })

    // Calculate average sentiment and activity for each day
    return Array.from(tweetsByDay.entries())
      .map(([date, data]) => {
        const avgScore = data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length
        const totalActivity = data.activities.reduce((sum, activity) => sum + activity, 0)

        return {
          timestamp: date,
          score: avgScore,
          activity: totalActivity,
        }
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery) {
      loadData(searchQuery)
    }
  }

  // Handle timeframe change
  const handleTimeframeChange = (value: string) => {
    setTimeframe(value)
    if (selectedUsername) {
      loadData(selectedUsername)
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
          <h1 className="text-2xl font-bold">Price & Sentiment Correlation</h1>
        </div>

        <form onSubmit={handleSearch} className="relative max-w-md flex mb-6">
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

        {usingSampleData && (
          <div className="mb-6">
            <Card className="bg-amber-950/50 border-amber-800 text-amber-300">
              <CardContent className="p-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <p>
                  Using sample data because Twitter API authentication failed. Price correlation analysis may not be
                  accurate.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading price and sentiment data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center p-4">
              <p className="text-red-400 mb-2">{error}</p>
              <Button variant="outline" onClick={() => loadData("VitalikButerin")}>
                Load Default Data
              </Button>
            </div>
          </div>
        ) : correlations.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
              {Object.values(priceData).map((price) => (
                <TokenPriceCard key={price.symbol} priceData={price} />
              ))}
            </div>

            <PriceCorrelation correlations={correlations} onTimeframeChange={handleTimeframeChange} />
          </>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center p-4">
              <p className="text-gray-400 mb-2">
                No price correlation data available. Try searching for a different Twitter handle.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

