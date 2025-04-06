"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, AlertTriangle } from "lucide-react"
import { SentimentAnalysis } from "../components/sentiment-analysis"
import { WordCloud } from "../components/word-cloud"
import { fetchTwitterGraph } from "../actions"
import { getUserTweets } from "@/lib/twitter-api"
import { analyzeTweetsSentiment } from "@/lib/sentiment-service"
import type { GraphData, TwitterTweet } from "@/types/twitter"

export default function SentimentPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] })
  const [tweets, setTweets] = useState<(TwitterTweet & { sentiment: any })[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usingSampleData, setUsingSampleData] = useState(false)
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null)

  // Add word cloud data state
  const [wordCloudData, setWordCloudData] = useState<
    Array<{
      text: string
      value: number
      sentiment: "positive" | "negative" | "neutral"
    }>
  >([])

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

          // Process word cloud data
          processWordCloudData(analyzedTweets)
        } else {
          setTweets([])
          setWordCloudData([])
        }
      }
    } catch (err) {
      console.error("Error loading data:", err)
      setError("Failed to load Twitter data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Process word cloud data from tweets
  const processWordCloudData = (analyzedTweets: any[]) => {
    const wordFrequency: Record<string, { count: number; sentiment: "positive" | "negative" | "neutral" }> = {}

    analyzedTweets.forEach((tweet) => {
      if (!tweet.sentiment) return

      // Add positive words
      tweet.sentiment.positive.forEach((word: string) => {
        if (word.length < 3) return // Skip short words
        if (!wordFrequency[word]) {
          wordFrequency[word] = { count: 0, sentiment: "positive" }
        }
        wordFrequency[word].count++
      })

      // Add negative words
      tweet.sentiment.negative.forEach((word: string) => {
        if (word.length < 3) return // Skip short words
        if (!wordFrequency[word]) {
          wordFrequency[word] = { count: 0, sentiment: "negative" }
        }
        wordFrequency[word].count++
      })

      // Add other significant words
      const words = tweet.text
        .toLowerCase()
        .replace(/[^\w\s]/gi, "")
        .split(/\s+/)
        .filter(
          (word: string) =>
            word.length > 3 && !["https", "http", "the", "and", "for", "that", "this", "with"].includes(word),
        )

      words.forEach((word: string) => {
        if (!wordFrequency[word]) {
          wordFrequency[word] = { count: 0, sentiment: "neutral" }
        }
        wordFrequency[word].count++
      })
    })

    // Convert to array and sort by frequency
    const wordCloudArray = Object.entries(wordFrequency)
      .map(([text, { count, sentiment }]) => ({ text, value: count, sentiment }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 50) // Take top 50 words

    setWordCloudData(wordCloudArray)
  }

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery) {
      loadData(searchQuery)
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
          <h1 className="text-2xl font-bold">Sentiment Analysis</h1>
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
                  Using sample data because Twitter API authentication failed. Sentiment analysis may not be accurate.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading sentiment data...</p>
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
        ) : tweets.length > 0 && selectedUsername ? (
          <>
            <SentimentAnalysis
              tweets={tweets}
              username={selectedUsername}
              imageUrl={graphData.nodes.find((node) => node.username === selectedUsername)?.imageUrl}
            />

            {wordCloudData.length > 0 && (
              <div className="mt-6">
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader className="px-4 py-3 border-b border-gray-800">
                    <CardTitle>Word Cloud</CardTitle>
                    <CardDescription className="text-gray-400">
                      Common words in tweets colored by sentiment
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <WordCloud words={wordCloudData} width={800} height={400} />
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center p-4">
              <p className="text-gray-400 mb-2">
                No tweets available for sentiment analysis. Try searching for a different Twitter handle.
              </p>
            </div>
          </div>
        )}

        {graphData.nodes.length > 0 && (
          <div className="mt-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="px-4 py-3 border-b border-gray-800">
                <CardTitle>Network Accounts</CardTitle>
                <CardDescription className="text-gray-400">Select an account to analyze its sentiment</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {graphData.nodes.slice(0, 12).map((node) => (
                    <Button
                      key={node.id}
                      variant="outline"
                      className={`justify-start h-auto p-3 ${
                        selectedUsername === node.username ? "bg-gray-800 border-blue-500" : "border-gray-700"
                      }`}
                      onClick={() => {
                        setSelectedUsername(node.username)
                        // In a real implementation, you would fetch tweets for this user
                        // and analyze sentiment
                      }}
                    >
                      <div className="flex flex-col items-start">
                        <div className="font-medium">{node.name}</div>
                        <div className="text-xs text-gray-400">@{node.username}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  )
}

