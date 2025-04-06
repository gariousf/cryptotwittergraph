"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, AlertTriangle } from "lucide-react"
import { SentimentAnalysis } from "../components/sentiment-analysis"
import { EnhancedWordCloud } from "../components/enhanced-word-cloud"
import { SentimentTimeline } from "../components/sentiment-timeline"
import { fetchTwitterGraph } from "../actions"
import { getUserTweets, searchTweets, getTweetsByHashtag } from "@/lib/twitter-api"
import { analyzeTweetsSentiment, extractKeyTerms, calculateOverallSentiment } from "@/lib/sentiment-service"
import type { GraphData, TwitterTweet } from "@/types/twitter"
import type { SentimentType } from "@/lib/sentiment-service"

export default function SentimentPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] })
  const [tweets, setTweets] = useState<(TwitterTweet & { sentiment: any })[]>([])
  const [wordCloudData, setWordCloudData] = useState<Array<{
    text: string
    value: number
    sentiment: "positive" | "negative" | "neutral"
  }>>([])
  const [overallSentiment, setOverallSentiment] = useState<{
    averageScore: number
    type: SentimentType
    distribution: Record<string, number>
  }>({
    averageScore: 0,
    type: "neutral",
    distribution: {
      "very-negative": 0,
      "negative": 0,
      "neutral": 0,
      "positive": 0,
      "very-positive": 0
    }
  })
  const [timelineData, setTimelineData] = useState<Array<{
    date: string
    sentiment: number
    tweets: number
  }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null)

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setLoading(true)
    setError(null)
    setTweets([])
    setWordCloudData([])
    setTimelineData([])
    setSelectedUsername(null)

    try {
      // Determine if search is for a username, hashtag, or keyword
      let fetchedTweets: TwitterTweet[] = []
      
      if (searchQuery.startsWith("@")) {
        // Username search
        const username = searchQuery.substring(1)
        setSelectedUsername(username)
        
        // Get graph data to find user ID
        const { data } = await fetchTwitterGraph(username, 1)
        setGraphData(data)
        
        // Find the user node
        const userNode = data.nodes.find(node => 
          node.username.toLowerCase() === username.toLowerCase()
        )
        
        if (userNode) {
          fetchedTweets = await getUserTweets(userNode.id, 100)
        } else {
          setError(`User @${username} not found`)
        }
      } else if (searchQuery.startsWith("#")) {
        // Hashtag search
        const hashtag = searchQuery.substring(1)
        fetchedTweets = await getTweetsByHashtag(hashtag, 100)
      } else {
        // Keyword search
        fetchedTweets = await searchTweets(searchQuery, 100)
      }

      if (fetchedTweets.length === 0) {
        setError("No tweets found for your search query")
        setLoading(false)
        return
      }

      // Analyze sentiment
      const analyzedTweets = await analyzeTweetsSentiment(fetchedTweets)
      setTweets(analyzedTweets)
      
      // Extract key terms for word cloud
      const terms = extractKeyTerms(analyzedTweets)
      setWordCloudData(terms)
      
      // Calculate overall sentiment
      const sentiment = calculateOverallSentiment(analyzedTweets)
      setOverallSentiment(sentiment)
      
      // Prepare timeline data
      const timeline = prepareTimelineData(analyzedTweets)
      setTimelineData(timeline)
    } catch (err) {
      console.error("Error analyzing sentiment:", err)
      setError("An error occurred while analyzing sentiment")
    } finally {
      setLoading(false)
    }
  }

  // Prepare timeline data from tweets
  const prepareTimelineData = (analyzedTweets: (TwitterTweet & { sentiment: any })[]) => {
    // Group tweets by date
    const tweetsByDate = analyzedTweets.reduce((acc, tweet) => {
      if (!tweet.created_at) return acc
      
      const date = new Date(tweet.created_at).toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = {
          tweets: [],
          totalSentiment: 0
        }
      }
      
      acc[date].tweets.push(tweet)
      acc[date].totalSentiment += tweet.sentiment?.score || 0
      
      return acc
    }, {} as Record<string, { tweets: any[], totalSentiment: number }>)
    
    // Convert to array and calculate average sentiment
    return Object.entries(tweetsByDate)
      .map(([date, data]) => ({
        date,
        sentiment: data.totalSentiment / data.tweets.length,
        tweets: data.tweets.length
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  // Handle key press for search
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <main className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Sentiment Analysis</h1>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Search by @username, #hashtag, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="max-w-md"
          />
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? "Analyzing..." : "Analyze"}
            {!loading && <Search className="ml-2 h-4 w-4" />}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {tweets.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sentiment Overview</CardTitle>
                  <CardDescription>
                    Overall sentiment analysis for {selectedUsername ? `@${selectedUsername}` : searchQuery}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-gray-400">Average Sentiment</div>
                        <div className="text-2xl font-bold">{overallSentiment.averageScore.toFixed(2)}</div>
                      </div>
                      <div className="text-4xl">
                        {getSentimentEmoji(overallSentiment.type)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-5 gap-2 mt-4">
                      {Object.entries(overallSentiment.distribution).map(([type, count]) => (
                        <div key={type} className="flex flex-col items-center">
                          <div className="text-xs text-gray-400">{type.replace('-', ' ')}</div>
                          <div className="text-lg font-bold">{count}</div>
                          <div className="w-full h-1 mt-1" style={{ backgroundColor: getSentimentColor(type) }}></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Key Terms</CardTitle>
                  <CardDescription>
                    Most frequent terms colored by sentiment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EnhancedWordCloud words={wordCloudData} width={400} height={200} />
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Sentiment Timeline</CardTitle>
                <CardDescription>
                  How sentiment changes over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SentimentTimeline data={timelineData} height={300} />
              </CardContent>
            </Card>
            
            <SentimentAnalysis 
              tweets={tweets} 
              username={selectedUsername || searchQuery} 
              imageUrl={selectedUsername ? graphData.nodes.find(n => n.username === selectedUsername)?.imageUrl : undefined} 
            />
          </>
        ) : (
          !loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Sentiment Analysis</CardTitle>
                  <CardDescription>
                    Analyze sentiment in tweets to understand public opinion
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-400">
                      Search for a Twitter username, hashtag, or keyword to analyze sentiment
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      Examples: @elonmusk, #bitcoin, crypto
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Popular Accounts</CardTitle>
                  <CardDescription>
                    Analyze these popular crypto accounts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    {graphData.nodes.slice(0, 5).map((node) => (
                      <Button
                        key={node.id}
                        variant="outline"
                        className="justify-start"
                        onClick={() => {
                          setSearchQuery(`@${node.username}`)
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
          )
        )}
      </div>
    </main>
  )
}

// Helper function to get sentiment emoji
function getSentimentEmoji(type: string): string {
  switch (type) {
    case "very-negative":
      return "😡"
    case "negative":
      return "😟"
    case "neutral":
      return "😐"
    case "positive":
      return "🙂"
    case "very-positive":
      return "😄"
    default:
      return "😐"
  }
}

