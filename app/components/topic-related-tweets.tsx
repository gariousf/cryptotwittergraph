"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Hashtag, MessageSquare, RefreshCw } from "lucide-react"
import { retrieveTopicTweets } from "@/lib/topic-retrieval-service"
import { TweetCard } from "./tweet-card"
import type { TwitterTweet } from "@/types/twitter"

interface TopicRelatedTweetsProps {
  topic: string
  limit?: number
}

export function TopicRelatedTweets({ topic, limit = 10 }: TopicRelatedTweetsProps) {
  const [data, setData] = useState<{
    tweets: TwitterTweet[],
    relatedTopics: string[]
  }>({ tweets: [], relatedTopics: [] })
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const result = await retrieveTopicTweets(topic, limit)
        setData(result)
      } catch (error) {
        console.error("Error fetching related tweets:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [topic, limit])
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-500" />
          Tweets Related to #{topic}
        </CardTitle>
        <CardDescription>
          Intelligently retrieved tweets about this topic
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {data.relatedTopics.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Related Topics:</h4>
                <div className="flex flex-wrap gap-2">
                  {data.relatedTopics.map((relatedTopic, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      <Hashtag className="h-3 w-3" />
                      {relatedTopic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {data.tweets.length > 0 ? (
              <div className="space-y-4">
                {data.tweets.map((tweet) => (
                  <TweetCard key={tweet.id} tweet={tweet} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No related tweets found
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
} 