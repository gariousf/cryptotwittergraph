"use client"

import { useState, useEffect } from "react"
import { EmergingTopics } from "../components/emerging-topics"
import { TopicAssociationGraph } from "../components/topic-association-graph"
import { processTweetsForTopicDetection, getEmergingTopics } from "@/lib/topic-detection-service"
import { searchTweets } from "@/lib/twitter-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, RefreshCw } from "lucide-react"

export default function TopicsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [rules, setRules] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const { rules } = await getEmergingTopics()
        setRules(rules)
      } catch (error) {
        console.error("Error fetching initial data:", error)
      }
    }
    
    fetchInitialData()
  }, [])
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setLoading(true)
    try {
      const tweets = await searchTweets(searchQuery)
      
      setProcessing(true)
      await processTweetsForTopicDetection(tweets)
      
      const { rules } = await getEmergingTopics()
      setRules(rules)
    } catch (error) {
      console.error("Error processing tweets:", error)
    } finally {
      setLoading(false)
      setProcessing(false)
    }
  }
  
  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Topic Analysis</h1>
      
      <div className="mb-8">
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Search for tweets to analyze..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="max-w-md"
          />
          <Button onClick={handleSearch} disabled={loading || processing}>
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Search
              </>
            )}
          </Button>
          {processing && (
            <div className="flex items-center text-sm text-gray-500">
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Processing tweets...
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <EmergingTopics />
        <TopicAssociationGraph rules={rules} />
      </div>
    </main>
  )
} 