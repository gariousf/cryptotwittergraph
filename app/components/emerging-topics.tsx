"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sparkles, TrendingUp, Hash } from "lucide-react"
import { getEmergingTopics } from "@/lib/topic-detection-service"
import { useRouter } from "next/navigation"

export function EmergingTopics() {
  const router = useRouter()
  const [topics, setTopics] = useState<{
    patterns: any[],
    rules: any[]
  }>({ patterns: [], rules: [] })
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const data = await getEmergingTopics(10)
        setTopics(data)
      } catch (error) {
        console.error("Error fetching emerging topics:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchTopics()
  }, [])
  
  const handleHashtagClick = (hashtag: string) => {
    router.push(`/hashtag/${hashtag.replace(/^#/, '')}`)
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          Emerging Topics
        </CardTitle>
        <CardDescription>
          Discover trending topics and hashtag associations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="patterns">
          <TabsList className="mb-4">
            <TabsTrigger value="patterns">
              <TrendingUp className="h-4 w-4 mr-2" />
              High Utility Patterns
            </TabsTrigger>
            <TabsTrigger value="rules">
              <Hash className="h-4 w-4 mr-2" />
              Association Rules
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="patterns">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : topics.patterns.length > 0 ? (
              <div className="space-y-4">
                {topics.patterns.map((pattern, index) => (
                  <div key={index} className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">Pattern #{index + 1}</div>
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Utility: {pattern.utility.toFixed(2)}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {pattern.pattern.map((tag: string, i: number) => (
                        <Button 
                          key={i} 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleHashtagClick(tag)}
                          className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                        >
                          #{tag}
                        </Button>
                      ))}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Frequency: {pattern.frequency} tweets
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No emerging patterns found
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="rules">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : topics.rules.length > 0 ? (
              <div className="space-y-4">
                {topics.rules.map((rule, index) => (
                  <div key={index} className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">Rule #{index + 1}</div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Conf: {(rule.confidence * 100).toFixed(1)}%
                        </Badge>
                        <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          Lift: {rule.lift.toFixed(2)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex flex-wrap gap-1">
                        {rule.antecedent.map((tag: string, i: number) => (
                          <Button 
                            key={i} 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleHashtagClick(tag)}
                            className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                          >
                            #{tag}
                          </Button>
                        ))}
                      </div>
                      <div className="text-gray-500">→</div>
                      <div className="flex flex-wrap gap-1">
                        {rule.consequent.map((tag: string, i: number) => (
                          <Button 
                            key={i} 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleHashtagClick(tag)}
                            className="bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-200"
                          >
                            #{tag}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Support: {(rule.support * 100).toFixed(1)}% of tweets
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No association rules found
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 