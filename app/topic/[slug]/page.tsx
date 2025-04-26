"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { TopicRelatedTweets } from "@/app/components/topic-related-tweets"
import { TopicAssociationGraph } from "@/app/components/topic-association-graph"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Hashtag, TrendingUp } from "lucide-react"
import { retrieveTopicTweets } from "@/lib/topic-retrieval-service"
import { getTopicTimeline } from "@/lib/topic-detection-service"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export default function TopicPage() {
  const { slug } = useParams() as { slug: string }
  const topic = decodeURIComponent(slug)
  
  const [timeline, setTimeline] = useState<{
    dates: string[],
    frequencies: number[],
    associations: Record<string, number>[]
  }>({ dates: [], frequencies: [], associations: [] })
  
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const timelineData = await getTopicTimeline(topic)
        setTimeline(timelineData)
      } catch (error) {
        console.error("Error fetching topic timeline:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [topic])
  
  // Prepare chart data
  const chartData = timeline.dates.map((date, index) => ({
    date,
    frequency: timeline.frequencies[index]
  }))
  
  return (
    <main className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Hashtag className="h-8 w-8 text-blue-500" />
          {topic}
        </h1>
        <p className="text-gray-500 mt-1">
          Topic analysis and related tweets
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              Topic Frequency Over Time
            </CardTitle>
            <CardDescription>
              How often this topic appears in tweets
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : chartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      angle={-45} 
                      textAnchor="end" 
                      height={60} 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`${value} tweets`, 'Frequency']}
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: 'none',
                        borderRadius: '0.375rem'
                      }}
                      itemStyle={{ color: '#e5e7eb' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="frequency" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6, strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No timeline data available
              </div>
            )}
          </CardContent>
        </Card>
        
        <TopicRelatedTweets topic={topic} limit={5} />
      </div>
      
      <TopicAssociationGraph rules={[]} />
    </main>
  )
} 