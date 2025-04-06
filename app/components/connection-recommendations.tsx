"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"
import type { RecommendedConnection } from "@/lib/analytics-service"
import { getInitials, formatNumber, getBackgroundColorForGroup, getTextColorForGroup } from "@/lib/ui-helpers"

interface ConnectionRecommendationsProps {
  recommendations: RecommendedConnection[]
  onSelectNode?: (nodeId: string) => void
}

const getBorderColorForGroup = (group: string): string => {
  switch (group) {
    case "community":
      return "border-blue-500"
    case "investor":
      return "border-green-500"
    case "kol":
      return "border-purple-500"
    default:
      return "border-gray-500"
  }
}

export function ConnectionRecommendations({ recommendations, onSelectNode }: ConnectionRecommendationsProps) {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="px-4 py-3 border-b border-gray-800">
        <CardTitle>Recommended Connections</CardTitle>
        <CardDescription className="text-gray-400">Based on your network</CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          {recommendations.length > 0 ? (
            recommendations.map((recommendation) => (
              <div key={recommendation.node.id} className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <Avatar
                    className={`h-10 w-10 border-2 ${getBorderColorForGroup(recommendation.node.group)}`}
                    onClick={() => onSelectNode?.(recommendation.node.id)}
                  >
                    {recommendation.node.imageUrl ? (
                      <AvatarImage src={recommendation.node.imageUrl} />
                    ) : (
                      <AvatarFallback
                        className={`${getBackgroundColorForGroup(recommendation.node.group)} ${getTextColorForGroup(recommendation.node.group)}`}
                      >
                        {getInitials(recommendation.node.name)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3
                        className="font-bold cursor-pointer hover:underline"
                        onClick={() => onSelectNode?.(recommendation.node.id)}
                      >
                        {recommendation.node.name}
                      </h3>
                      <Badge
                        variant="outline"
                        style={{
                          backgroundColor: `${getBackgroundColorForGroup(recommendation.node.group)}`,
                          color: `${getTextColorForGroup(recommendation.node.group).replace('text-', '')}`
                        }}
                      >
                        {recommendation.node.group === "kol"
                          ? "KOL"
                          : recommendation.node.group.charAt(0).toUpperCase() + recommendation.node.group.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400">@{recommendation.node.username}</p>
                    <p className="text-sm text-gray-300 mt-1">
                      {recommendation.node.description?.substring(0, 100)}
                      {recommendation.node.description && recommendation.node.description.length > 100 ? "..." : ""}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs text-gray-400">
                        <span className="font-medium text-white">{formatNumber(recommendation.node.followers)}</span>{" "}
                        followers
                      </div>
                      <Button size="sm" className="h-8 gap-1">
                        <UserPlus className="h-3.5 w-3.5" />
                        Follow
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="text-xs text-gray-400">
                    <span className="text-gray-300">Why:</span> {recommendation.reason}
                  </div>
                  {recommendation.commonConnections.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-400 mb-1">Common connections:</div>
                      <div className="flex -space-x-2 overflow-hidden">
                        {recommendation.commonConnections.slice(0, 5).map((connection) => (
                          <Avatar
                            key={connection.id}
                            className="h-6 w-6 border border-gray-800 inline-block"
                            onClick={() => onSelectNode?.(connection.id)}
                          >
                            {connection.imageUrl ? (
                              <AvatarImage src={connection.imageUrl} />
                            ) : (
                              <AvatarFallback
                                className={`${getBackgroundColorForGroup(connection.group)} ${getTextColorForGroup(connection.group)} text-[10px]`}
                              >
                                {getInitials(connection.name)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                        ))}
                        {recommendation.commonConnections.length > 5 && (
                          <div className="h-6 w-6 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-300 border border-gray-800">
                            +{recommendation.commonConnections.length - 5}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-400">No recommendations available</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

