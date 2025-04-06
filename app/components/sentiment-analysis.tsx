"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { getSentimentColor, getSentimentEmoji } from "@/lib/sentiment-utils"
import { getInitials } from "@/lib/ui-helpers"
import type { SentimentType } from "@/lib/sentiment-constants"
import type { TwitterTweet } from "@/types/twitter"

interface SentimentAnalysisProps {
  tweets: (TwitterTweet & { sentiment: any })[]
  username: string
  imageUrl?: string
}

export function SentimentAnalysis({ tweets, username, imageUrl }: SentimentAnalysisProps) {
  const [selectedSentiment, setSelectedSentiment] = useState<SentimentType | "all">("all")

  // Calculate sentiment distribution
  const sentimentDistribution: Record<SentimentType, number> = {
    "very-negative": 0,
    negative: 0,
    neutral: 0,
    positive: 0,
    "very-positive": 0,
  }

  tweets.forEach((tweet) => {
    if (tweet.sentiment) {
      sentimentDistribution[tweet.sentiment.type as SentimentType]++
    }
  })

  // Calculate average sentiment score
  const totalScore = tweets.reduce((sum, tweet) => sum + (tweet.sentiment?.score || 0), 0)
  const averageScore = tweets.length > 0 ? totalScore / tweets.length : 0

  // Prepare data for pie chart
  const pieData = Object.entries(sentimentDistribution).map(([type, count]) => ({
    name: type,
    value: count,
    color: getSentimentColor(type as SentimentType),
  }))

  // Prepare data for bar chart
  const barData = tweets
    .filter((tweet) => tweet.sentiment)
    .map((tweet) => ({
      id: tweet.id,
      score: tweet.sentiment.score,
      type: tweet.sentiment.type,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)

  // Filter tweets based on selected sentiment
  const filteredTweets =
    selectedSentiment === "all"
      ? tweets
      : tweets.filter((tweet) => tweet.sentiment && tweet.sentiment.type === selectedSentiment)

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="px-4 py-3 border-b border-gray-800">
        <CardTitle>Sentiment Analysis</CardTitle>
        <CardDescription className="text-gray-400">Analyzing sentiment of @{username}'s recent tweets</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="overview">
          <TabsList className="grid grid-cols-2 bg-gray-800">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tweets">Tweets</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-800 p-4 rounded-md">
                <div className="text-sm text-gray-400 mb-1">Average Sentiment</div>
                <div className="flex items-center">
                  <div className="text-2xl font-bold mr-2">{averageScore.toFixed(1)}</div>
                  <div className="text-xl">
                    {averageScore < -5
                      ? "😡"
                      : averageScore < -1
                        ? "😟"
                        : averageScore < 1
                          ? "😐"
                          : averageScore < 5
                            ? "🙂"
                            : "😄"}
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1">Based on {tweets.length} tweets</div>
              </div>

              <div className="bg-gray-800 p-4 rounded-md">
                <div className="text-sm text-gray-400 mb-1">Sentiment Distribution</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(sentimentDistribution).map(([type, count]) => (
                    <Badge
                      key={type}
                      variant="outline"
                      className="cursor-pointer"
                      style={{
                        backgroundColor: `${getSentimentColor(type as SentimentType)}20`,
                        color: getSentimentColor(type as SentimentType),
                        borderColor: `${getSentimentColor(type as SentimentType)}40`,
                      }}
                      onClick={() => setSelectedSentiment(selectedSentiment === type ? "all" : (type as SentimentType))}
                    >
                      {type.replace("-", " ")} ({count})
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Sentiment Distribution</h3>
                <div className="h-64">
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
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Sentiment Scores</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="id" tick={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "0.375rem" }}
                        itemStyle={{ color: "#e5e7eb" }}
                        labelStyle={{ color: "#e5e7eb", fontWeight: "bold" }}
                        formatter={(value, name, props) => [value, "Sentiment Score"]}
                        labelFormatter={(value) => `Tweet ID: ${value.substring(0, 8)}...`}
                      />
                      <Bar
                        dataKey="score"
                        name="Sentiment Score"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                        isAnimationActive={false}
                      >
                        {barData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getSentimentColor(entry.type as SentimentType)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tweets" className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="text-sm text-gray-400">Filter by sentiment:</div>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className={`cursor-pointer ${selectedSentiment === "all" ? "bg-gray-700" : ""}`}
                  onClick={() => setSelectedSentiment("all")}
                >
                  All
                </Badge>
                {Object.keys(sentimentDistribution).map((type) => (
                  <Badge
                    key={type}
                    variant="outline"
                    className={`cursor-pointer ${selectedSentiment === type ? "bg-opacity-30" : "bg-opacity-10"}`}
                    style={{
                      backgroundColor:
                        selectedSentiment === type
                          ? `${getSentimentColor(type as SentimentType)}30`
                          : `${getSentimentColor(type as SentimentType)}10`,
                      color: getSentimentColor(type as SentimentType),
                      borderColor: `${getSentimentColor(type as SentimentType)}40`,
                    }}
                    onClick={() => setSelectedSentiment(selectedSentiment === type ? "all" : (type as SentimentType))}
                  >
                    {getSentimentEmoji(type as SentimentType)} {type.replace("-", " ")}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {filteredTweets.length > 0 ? (
                filteredTweets.map((tweet) => (
                  <div key={tweet.id} className="bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 border border-gray-700">
                        {imageUrl ? (
                          <AvatarImage src={imageUrl} />
                        ) : (
                          <AvatarFallback className="bg-blue-500/20 text-blue-400">
                            {getInitials(username)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">@{username}</div>
                          <div className="text-xs text-gray-400">{new Date(tweet.created_at).toLocaleDateString()}</div>
                          {tweet.sentiment && (
                            <Badge
                              variant="outline"
                              style={{
                                backgroundColor: `${getSentimentColor(tweet.sentiment.type)}20`,
                                color: getSentimentColor(tweet.sentiment.type),
                                borderColor: `${getSentimentColor(tweet.sentiment.type)}40`,
                              }}
                            >
                              {getSentimentEmoji(tweet.sentiment.type)} {tweet.sentiment.score.toFixed(1)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm mt-1">{tweet.text}</p>
                        {tweet.public_metrics && (
                          <div className="flex gap-4 mt-2 text-xs text-gray-400">
                            <div>♻️ {tweet.public_metrics.retweet_count}</div>
                            <div>💬 {tweet.public_metrics.reply_count}</div>
                            <div>❤️ {tweet.public_metrics.like_count}</div>
                          </div>
                        )}
                      </div>
                    </div>
                    {tweet.sentiment &&
                      (tweet.sentiment.positive.length > 0 || tweet.sentiment.negative.length > 0) && (
                        <div className="mt-2 pt-2 border-t border-gray-700 text-xs">
                          {tweet.sentiment.positive.length > 0 && (
                            <div className="text-emerald-400">Positive: {tweet.sentiment.positive.join(", ")}</div>
                          )}
                          {tweet.sentiment.negative.length > 0 && (
                            <div className="text-red-400">Negative: {tweet.sentiment.negative.join(", ")}</div>
                          )}
                        </div>
                      )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-400">No tweets found</div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

