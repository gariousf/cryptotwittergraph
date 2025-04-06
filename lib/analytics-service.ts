import type { GraphData, GraphNode, GraphLink } from "@/types/twitter"
import jLouvain from "jlouvain"

// Types for analytics
export interface NodeAnalytics {
  id: string
  name: string
  username: string
  group: string
  followers: number
  engagement: number
  degreeCentrality: number
  betweennessCentrality: number
  closenessCentrality: number
  community?: number
  kolRank?: number
}

export interface CommunityInfo {
  id: number
  size: number
  topNodes: GraphNode[]
  avgFollowers: number
  dominantGroup: string
}

export interface TimeframeData {
  timestamp: string
  interactions: number
  newNodes: number
}

export interface RecommendedConnection {
  node: GraphNode
  score: number
  commonConnections: GraphNode[]
  reason: string
}

// Calculate engagement score based on interactions
export function calculateEngagement(nodeId: string, links: GraphLink[]): number {
  // Count mentions, retweets, and quotes
  const mentionsCount = links.filter(
    (link) =>
      (link.target === nodeId && link.type === "mentioned") || (link.source === nodeId && link.type === "mentioned"),
  ).length

  const retweetsCount = links.filter(
    (link) =>
      (link.target === nodeId && link.type === "retweeted") || (link.source === nodeId && link.type === "retweeted"),
  ).length

  const quotesCount = links.filter(
    (link) => (link.target === nodeId && link.type === "quoted") || (link.source === nodeId && link.type === "quoted"),
  ).length

  // Weight different interaction types
  return mentionsCount * 1 + retweetsCount * 2 + quotesCount * 1.5
}

// Calculate degree centrality (number of connections)
export function calculateDegreeCentrality(nodeId: string, links: GraphLink[]): number {
  return links.filter((link) => link.source === nodeId || link.target === nodeId).length
}

// Calculate betweenness centrality (simplified version)
// In a real implementation, you would use a more sophisticated algorithm
export function calculateBetweennessCentrality(nodeId: string, nodes: GraphNode[], links: GraphLink[]): number {
  // This is a simplified approximation
  // For a real implementation, you would use a proper algorithm like Brandes' algorithm
  const degree = calculateDegreeCentrality(nodeId, links)
  const totalNodes = nodes.length

  if (totalNodes <= 2) return 0

  // Normalize by the maximum possible betweenness
  return degree / (totalNodes - 1)
}

// Calculate closeness centrality (simplified version)
export function calculateClosenessCentrality(nodeId: string, nodes: GraphNode[], links: GraphLink[]): number {
  // This is a simplified approximation
  // For a real implementation, you would calculate actual shortest paths
  const degree = calculateDegreeCentrality(nodeId, links)
  const totalNodes = nodes.length

  if (totalNodes <= 1) return 0

  // Normalize
  return degree / (totalNodes - 1)
}

// Get top influencers by different metrics
export function getTopInfluencers(
  data: GraphData,
  metric:
    | "followers"
    | "engagement"
    | "degreeCentrality"
    | "betweennessCentrality"
    | "closenessCentrality" = "followers",
  limit = 10,
): NodeAnalytics[] {
  const { nodes, links } = data

  // Calculate analytics for each node
  const nodeAnalytics: NodeAnalytics[] = nodes.map((node) => {
    return {
      ...node,
      engagement: calculateEngagement(node.id, links),
      degreeCentrality: calculateDegreeCentrality(node.id, links),
      betweennessCentrality: calculateBetweennessCentrality(node.id, nodes, links),
      closenessCentrality: calculateClosenessCentrality(node.id, nodes, links),
    }
  })

  // Sort by the specified metric
  return nodeAnalytics.sort((a, b) => b[metric] - a[metric]).slice(0, limit)
}

// Detect communities using the Louvain algorithm
export function detectCommunities(data: GraphData): {
  nodeAnalytics: NodeAnalytics[]
  communities: CommunityInfo[]
} {
  try {
    const { nodes, links } = data

    // Prepare data for jLouvain
    const nodeIds = nodes.map((node) => node.id)
    const nodeMap = new Map(nodes.map((node) => [node.id, node]))

    // Create edge list for jLouvain
    const edges = links.map((link) => {
      const source = typeof link.source === "object" ? link.source.id : link.source
      const target = typeof link.target === "object" ? link.target.id : link.target
      return { source, target, weight: link.value }
    })

    // Run community detection
    try {
      const communityResult = jLouvain(nodeIds, edges)

      // Add community information to nodes
      const nodeAnalytics: NodeAnalytics[] = nodes.map((node) => {
        return {
          ...node,
          community: communityResult[node.id],
          engagement: calculateEngagement(node.id, links),
          degreeCentrality: calculateDegreeCentrality(node.id, links),
          betweennessCentrality: calculateBetweennessCentrality(node.id, nodes, links),
          closenessCentrality: calculateClosenessCentrality(node.id, nodes, links),
        }
      })

      // Get community information
      const communityMap = new Map<number, GraphNode[]>()

      nodeAnalytics.forEach((node) => {
        if (node.community !== undefined) {
          if (!communityMap.has(node.community)) {
            communityMap.set(node.community, [])
          }
          communityMap.get(node.community)?.push(node)
        }
      })

      // Calculate community statistics
      const communities: CommunityInfo[] = Array.from(communityMap.entries()).map(([id, communityNodes]) => {
        // Get top nodes by followers
        const topNodes = [...communityNodes].sort((a, b) => b.followers - a.followers).slice(0, 3)

        // Calculate average followers
        const avgFollowers = communityNodes.reduce((sum, node) => sum + node.followers, 0) / communityNodes.length

        // Find dominant group
        const groupCounts = new Map<string, number>()
        communityNodes.forEach((node) => {
          const group = node.group
          groupCounts.set(group, (groupCounts.get(group) || 0) + 1)
        })

        let dominantGroup = "mixed"
        let maxCount = 0

        groupCounts.forEach((count, group) => {
          if (count > maxCount) {
            maxCount = count
            dominantGroup = group
          }
        })

        return {
          id,
          size: communityNodes.length,
          topNodes,
          avgFollowers,
          dominantGroup,
        }
      })

      return { nodeAnalytics, communities }
    } catch (error) {
      console.error("jLouvain community detection failed, using fallback:", error)

      // Use simple community detection as fallback
      const communityResult = simpleDetectCommunities(nodes, links)

      // Add community information to nodes
      const nodeAnalytics: NodeAnalytics[] = nodes.map((node) => {
        return {
          ...node,
          community: communityResult[node.id],
          engagement: calculateEngagement(node.id, links),
          degreeCentrality: calculateDegreeCentrality(node.id, links),
          betweennessCentrality: calculateBetweennessCentrality(node.id, nodes, links),
          closenessCentrality: calculateClosenessCentrality(node.id, nodes, links),
        }
      })

      // Continue with the rest of the function...
      // Get community information
      const communityMap = new Map<number, GraphNode[]>()

      nodeAnalytics.forEach((node) => {
        if (node.community !== undefined) {
          if (!communityMap.has(node.community)) {
            communityMap.set(node.community, [])
          }
          communityMap.get(node.community)?.push(node)
        }
      })

      // Calculate community statistics
      const communities: CommunityInfo[] = Array.from(communityMap.entries()).map(([id, communityNodes]) => {
        // Get top nodes by followers
        const topNodes = [...communityNodes].sort((a, b) => b.followers - a.followers).slice(0, 3)

        // Calculate average followers
        const avgFollowers = communityNodes.reduce((sum, node) => sum + node.followers, 0) / communityNodes.length

        // Find dominant group
        const groupCounts = new Map<string, number>()
        communityNodes.forEach((node) => {
          const group = node.group
          groupCounts.set(group, (groupCounts.get(group) || 0) + 1)
        })

        let dominantGroup = "mixed"
        let maxCount = 0

        groupCounts.forEach((count, group) => {
          if (count > maxCount) {
            maxCount = count
            dominantGroup = group
          }
        })

        return {
          id,
          size: communityNodes.length,
          topNodes,
          avgFollowers,
          dominantGroup,
        }
      })

      return { nodeAnalytics, communities }
    }
  } catch (error) {
    console.error("Error in community detection:", error)
    return fallbackCommunityDetection(data)
  }
}

// Simple community detection based on node connections
function simpleDetectCommunities(nodes: GraphNode[], links: GraphLink[]): Record<string, number> {
  const communities: Record<string, number> = {}
  const visited = new Set<string>()
  let communityId = 0

  // Helper function to find connected nodes
  const findConnectedNodes = (nodeId: string, communityId: number) => {
    if (visited.has(nodeId)) return

    visited.add(nodeId)
    communities[nodeId] = communityId

    // Find all nodes connected to this node
    const connectedNodeIds = links
      .filter((link) => {
        const source = typeof link.source === "object" ? link.source.id : link.source
        const target = typeof link.target === "object" ? link.target.id : link.target
        return source === nodeId || target === nodeId
      })
      .map((link) => {
        const source = typeof link.source === "object" ? link.source.id : link.source
        const target = typeof link.target === "object" ? link.target.id : link.target
        return source === nodeId ? target : source
      })

    // Recursively process connected nodes
    connectedNodeIds.forEach((id) => {
      if (!visited.has(id)) {
        findConnectedNodes(id, communityId)
      }
    })
  }

  // Process all nodes
  nodes.forEach((node) => {
    if (!visited.has(node.id)) {
      findConnectedNodes(node.id, communityId)
      communityId++
    }
  })

  return communities
}

// Simple fallback community detection based on node groups
export function fallbackCommunityDetection(data: GraphData): {
  nodeAnalytics: NodeAnalytics[]
  communities: CommunityInfo[]
} {
  const { nodes, links } = data

  // Group nodes by their group type
  const groupMap = new Map<string, GraphNode[]>()
  nodes.forEach((node) => {
    if (!groupMap.has(node.group)) {
      groupMap.set(node.group, [])
    }
    groupMap.get(node.group)?.push(node)
  })

  // Assign community IDs based on groups
  const communityMap = new Map<string, number>()
  let communityId = 0
  groupMap.forEach((groupNodes, group) => {
    groupNodes.forEach((node) => {
      communityMap.set(node.id, communityId)
    })
    communityId++
  })

  // Create node analytics with community assignments
  const nodeAnalytics: NodeAnalytics[] = nodes.map((node) => {
    return {
      ...node,
      community: communityMap.get(node.id),
      engagement: calculateEngagement(node.id, links),
      degreeCentrality: calculateDegreeCentrality(node.id, links),
      betweennessCentrality: calculateBetweennessCentrality(node.id, nodes, links),
      closenessCentrality: calculateClosenessCentrality(node.id, nodes, links),
    }
  })

  // Create community information
  const communities: CommunityInfo[] = Array.from(groupMap.entries()).map(([group, groupNodes], index) => {
    // Get top nodes by followers
    const topNodes = [...groupNodes].sort((a, b) => b.followers - a.followers).slice(0, 3)

    // Calculate average followers
    const avgFollowers = groupNodes.reduce((sum, node) => sum + node.followers, 0) / groupNodes.length

    return {
      id: index,
      size: groupNodes.length,
      topNodes,
      avgFollowers,
      dominantGroup: group,
    }
  })

  return { nodeAnalytics, communities }
}

// Mock function to analyze trends over time
// In a real implementation, you would use actual timestamped data
export function analyzeTrends(data: GraphData, timeframe: "day" | "week" | "month" = "week"): TimeframeData[] {
  // This is a mock implementation
  // In a real implementation, you would use actual timestamps from your data

  const now = new Date()
  const result: TimeframeData[] = []

  // Generate mock data for the specified timeframe
  const numPoints = timeframe === "day" ? 24 : timeframe === "week" ? 7 : 30
  const intervalMs =
    timeframe === "day" ? 60 * 60 * 1000 : timeframe === "week" ? 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000

  for (let i = numPoints - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * intervalMs)

    // Generate some random data based on the actual graph size
    const baseInteractions = data.links.length / numPoints
    const baseNodes = data.nodes.length / numPoints

    result.push({
      timestamp: timestamp.toISOString(),
      interactions: Math.round(baseInteractions * (0.5 + Math.random())),
      newNodes: Math.round(baseNodes * (0.3 + Math.random() * 0.7)),
    })
  }

  return result
}

// Recommend new connections based on network topology
export function recommendConnections(data: GraphData, nodeId: string, limit = 5): RecommendedConnection[] {
  const { nodes, links } = data
  const nodeMap = new Map(nodes.map((node) => [node.id, node]))

  // Get current connections
  const currentConnections = new Set<string>()

  links.forEach((link) => {
    const source = typeof link.source === "object" ? link.source.id : link.source
    const target = typeof link.target === "object" ? link.target.id : link.target

    if (source === nodeId) {
      currentConnections.add(target)
    } else if (target === nodeId) {
      currentConnections.add(source)
    }
  })

  // Find potential connections (friends of friends)
  const potentialConnections = new Map<
    string,
    {
      node: GraphNode
      commonConnections: GraphNode[]
      score: number
    }
  >()

  // For each current connection
  currentConnections.forEach((connectionId) => {
    // Find their connections
    links.forEach((link) => {
      const source = typeof link.source === "object" ? link.source.id : link.source
      const target = typeof link.target === "object" ? link.target.id : link.target

      let secondDegreeId: string | null = null

      if (source === connectionId && target !== nodeId && !currentConnections.has(target)) {
        secondDegreeId = target
      } else if (target === connectionId && source !== nodeId && !currentConnections.has(source)) {
        secondDegreeId = source
      }

      if (secondDegreeId) {
        const secondDegreeNode = nodeMap.get(secondDegreeId)
        const connectionNode = nodeMap.get(connectionId)

        if (secondDegreeNode && connectionNode) {
          if (!potentialConnections.has(secondDegreeId)) {
            potentialConnections.set(secondDegreeId, {
              node: secondDegreeNode,
              commonConnections: [connectionNode],
              score: 1,
            })
          } else {
            const data = potentialConnections.get(secondDegreeId)!
            data.commonConnections.push(connectionNode)
            data.score += 1
          }
        }
      }
    })
  })

  // Convert to array and sort by score
  const recommendations = Array.from(potentialConnections.values())
    .map(({ node, commonConnections, score }) => {
      // Calculate a weighted score based on followers and common connections
      const weightedScore = score * 10 + Math.log10(node.followers) * 5

      // Generate a reason for the recommendation
      let reason = `${commonConnections.length} mutual connection${commonConnections.length > 1 ? "s" : ""}`

      if (node.group === "kol") {
        reason += ", Key Opinion Leader in crypto"
      } else if (node.group === "project") {
        reason += ", Blockchain project"
      } else if (node.followers > 100000) {
        reason += ", Popular account"
      }

      return {
        node,
        score: weightedScore,
        commonConnections,
        reason,
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  return recommendations
}

