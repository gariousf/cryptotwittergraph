"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import type { GraphData, ConnectionType, GraphNode } from "@/types/twitter"
import type { NodeAnalytics } from "@/lib/analytics-service"
import { detectCommunities } from "@/lib/analytics-service"

// Color scale for different node groups
const colorScale = {
  seed: "#f43f5e", // rose-500
  influencer: "#10b981", // emerald-500
  project: "#3b82f6", // blue-500
  investor: "#f59e0b", // amber-500
  company: "#8b5cf6", // purple-500
  dao: "#ec4899", // pink-500
  kol: "#06b6d4", // cyan-500
}

// Community color scale (for when coloring by community)
const communityColors = [
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#8b5cf6", // purple-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
  "#ef4444", // red-500
  "#84cc16", // lime-500
  "#14b8a6", // teal-500
  "#f97316", // orange-500
]

// Sentiment color scale
const sentimentColorScale = {
  "very-negative": "#ef4444", // red-500
  "negative": "#f97316", // orange-500
  "neutral": "#6b7280", // gray-500
  "positive": "#10b981", // emerald-500
  "very-positive": "#22c55e", // green-500
}

// Connection type styles
const connectionStyles = {
  follows: {
    strokeWidth: 1.5,
    strokeOpacity: 0.6,
    strokeDasharray: "none",
    color: "#374151", // gray-700
  },
  mentioned: {
    strokeWidth: 2,
    strokeOpacity: 0.7,
    strokeDasharray: "5,5",
    color: "#10b981", // emerald-500
  },
  retweeted: {
    strokeWidth: 2,
    strokeOpacity: 0.7,
    strokeDasharray: "none",
    color: "#3b82f6", // blue-500
  },
  quoted: {
    strokeWidth: 2,
    strokeOpacity: 0.7,
    strokeDasharray: "none",
    color: "#8b5cf6", // purple-500
  },
  replied: {
    strokeWidth: 2,
    strokeOpacity: 0.7,
    strokeDasharray: "3,3",
    color: "#ec4899", // pink-500
  },
}

// Layout types
export type LayoutType = "force" | "radial" | "circular" | "hierarchical"

// Node sizing options
export type NodeSizeMetric = "followers" | "degreeCentrality" | "betweennessCentrality" | "engagement" | "uniform"

// Node coloring options
export type NodeColorScheme = "group" | "community" | "sentiment"

interface ForceGraphProps {
  data: GraphData
  layout?: LayoutType
  nodeSizeMetric?: NodeSizeMetric
  nodeColorScheme?: NodeColorScheme
  onNodeClick?: (nodeId: string) => void
}

export function ForceGraph({
  data,
  layout = "force",
  nodeSizeMetric = "followers",
  nodeColorScheme = "group",
  onNodeClick,
}: ForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [nodeAnalytics, setNodeAnalytics] = useState<NodeAnalytics[]>([])
  const [communities, setCommunitiesData] = useState<{ [key: string]: number }>({})

  // Calculate node analytics and communities once when data changes
  useEffect(() => {
    if (data.nodes.length > 0) {
      try {
        const { nodeAnalytics, communities } = detectCommunities(data)
        setNodeAnalytics(nodeAnalytics)

        // Create a map of node ID to community
        const communityMap: { [key: string]: number } = {}
        nodeAnalytics.forEach((node) => {
          if (node.community !== undefined) {
            communityMap[node.id] = node.community
          }
        })
        setCommunitiesData(communityMap)
      } catch (error) {
        console.error("Error detecting communities:", error)
        // Set default analytics without community detection
        const defaultAnalytics = data.nodes.map((node) => ({
          ...node,
          engagement: 0,
          degreeCentrality: 0,
          betweennessCentrality: 0,
          closenessCentrality: 0,
        }))
        setNodeAnalytics(defaultAnalytics)
        setCommunitiesData({})
      }
    }
  }, [data])

  // Update dimensions on window resize
  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect()
        setDimensions({
          width: rect.width || 800,
          height: rect.height || 600,
        })
      }
    }

    // Initial measurement
    handleResize()

    // Add resize listener
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Create and update the graph
  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return

    const svg = d3.select(svgRef.current)
    const { width, height } = dimensions

    // Clear any existing elements
    svg.selectAll("*").remove()

    // Create a set of node IDs for quick lookup
    const nodeIds = new Set(data.nodes.map((node) => node.id))

    // Filter links to only include those with valid source and target nodes
    const validLinks = data.links.filter((link) => {
      const sourceId = typeof link.source === "object" ? link.source.id : link.source
      const targetId = typeof link.target === "object" ? link.target.id : link.target
      return nodeIds.has(sourceId) && nodeIds.has(targetId)
    })

    // Create a map for node analytics
    const analyticsMap = new Map(nodeAnalytics.map((node) => [node.id, node]))

    // Create a group for the graph elements
    const g = svg.append("g")

    // Add zoom functionality
    svg.call(
      d3
        .zoom()
        .extent([
          [0, 0],
          [width, height],
        ])
        .scaleExtent([0.1, 8])
        .on("zoom", (event) => {
          g.attr("transform", event.transform)
        }),
    )

    // Function to get node size based on selected metric
    const getNodeSize = (node: GraphNode) => {
      if (nodeSizeMetric === "uniform") return 8

      const analytics = analyticsMap.get(node.id)

      if (nodeSizeMetric === "followers") {
        return Math.sqrt(node.followers) / 40 + 5
      } else if (analytics) {
        switch (nodeSizeMetric) {
          case "degreeCentrality":
            return analytics.degreeCentrality / 2 + 5
          case "betweennessCentrality":
            return analytics.betweennessCentrality * 30 + 5
          case "engagement":
            return analytics.engagement / 2 + 5
          default:
            return Math.sqrt(node.followers) / 40 + 5
        }
      }

      return 5 // Default size
    }

    // Function to get node color based on selected scheme
    const getNodeColor = (node: GraphNode) => {
      if (nodeColorScheme === "community") {
        const communityId = communities[node.id]
        return communityId !== undefined ? communityColors[communityId % communityColors.length] : "#6b7280" // gray-500 as fallback
      } else if (nodeColorScheme === "sentiment") {
        return node.sentiment?.type 
          ? sentimentColorScale[node.sentiment.type] 
          : "#6b7280" // Default to gray
      } else {
        return colorScale[node.group as keyof typeof colorScale] || "#6b7280" // gray-500 as fallback
      }
    }

    // Create the links with different styles based on connection type
    const link = g
      .append("g")
      .selectAll("line")
      .data(validLinks)
      .join("line")
      .attr("stroke", (d: any) => {
        const type = d.type as ConnectionType
        return connectionStyles[type]?.color || connectionStyles.follows.color
      })
      .attr("stroke-width", (d: any) => {
        const type = d.type as ConnectionType
        return connectionStyles[type]?.strokeWidth || 1.5
      })
      .attr("stroke-opacity", (d: any) => {
        const type = d.type as ConnectionType
        return connectionStyles[type]?.strokeOpacity || 0.6
      })
      .attr("stroke-dasharray", (d: any) => {
        const type = d.type as ConnectionType
        return connectionStyles[type]?.strokeDasharray || "none"
      })

    // Create the nodes
    const node = g
      .append("g")
      .selectAll(".node")
      .data(data.nodes)
      .join("g")
      .attr("class", "node")
      .on("click", (event, d: any) => {
        if (onNodeClick) onNodeClick(d.id)
      })

    // Add circles to nodes
    node
      .append("circle")
      .attr("r", (d: any) => getNodeSize(d))
      .attr("fill", (d: any) => getNodeColor(d))
      .attr("stroke", "#1f2937") // gray-800
      .attr("stroke-width", 1.5)

    // Add labels to nodes
    node
      .append("text")
      .attr("dx", 12)
      .attr("dy", ".35em")
      .text((d: any) => d.name)
      .attr("font-size", "10px")
      .attr("fill", "#e5e7eb") // gray-200

    // Apply different layouts
    if (layout === "force") {
      // Force-directed layout (D3's default)
      const simulation = d3
        .forceSimulation(data.nodes)
        .force(
          "link",
          d3
            .forceLink(validLinks)
            .id((d: any) => d.id)
            .distance(100),
        )
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force(
          "collision",
          d3.forceCollide().radius((d: any) => getNodeSize(d) * 1.5),
        )

      // Enable dragging
      node.call(
        d3
          .drag()
          .on("start", (event, d: any) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on("drag", (event, d: any) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on("end", (event, d: any) => {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
          }),
      )

      // Update positions on each tick of the simulation
      simulation.on("tick", () => {
        link
          .attr("x1", (d: any) => d.source.x)
          .attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x)
          .attr("y2", (d: any) => d.target.y)

        node.attr("transform", (d: any) => `translate(${d.x},${d.y})`)
      })

      // Cleanup
      return () => {
        simulation.stop()
      }
    } else if (layout === "radial") {
      // Radial layout
      const radius = Math.min(width, height) / 2 - 100
      const angleStep = (2 * Math.PI) / data.nodes.length

      // Position nodes in a circle
      data.nodes.forEach((node, i) => {
        const angle = i * angleStep
        node.x = width / 2 + radius * Math.cos(angle)
        node.y = height / 2 + radius * Math.sin(angle)
      })

      // Position nodes
      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`)

      // Position links
      link
        .attr("x1", (d: any) =>
          typeof d.source === "object" ? d.source.x : data.nodes.find((n) => n.id === d.source)?.x,
        )
        .attr("y1", (d: any) =>
          typeof d.source === "object" ? d.source.y : data.nodes.find((n) => n.id === d.source)?.y,
        )
        .attr("x2", (d: any) =>
          typeof d.target === "object" ? d.target.x : data.nodes.find((n) => n.id === d.target)?.x,
        )
        .attr("y2", (d: any) =>
          typeof d.target === "object" ? d.target.y : data.nodes.find((n) => n.id === d.target)?.y,
        )
    } else if (layout === "circular") {
      // Circular layout - position nodes in a circle based on their group
      const groups = Array.from(new Set(data.nodes.map((node) => node.group)))
      const groupMap = new Map(groups.map((group, i) => [group, i]))

      const radius = Math.min(width, height) / 2 - 100

      // Group nodes by their group
      const nodesByGroup = new Map<string, GraphNode[]>()
      data.nodes.forEach((node) => {
        if (!nodesByGroup.has(node.group)) {
          nodesByGroup.set(node.group, [])
        }
        nodesByGroup.get(node.group)?.push(node)
      })

      // Position nodes in arcs by group
      let currentAngle = 0
      nodesByGroup.forEach((nodes, group) => {
        const groupSize = nodes.length
        const arcLength = 2 * Math.PI * (groupSize / data.nodes.length)
        const angleStep = arcLength / groupSize

        nodes.forEach((node, i) => {
          const angle = currentAngle + i * angleStep
          node.x = width / 2 + radius * Math.cos(angle)
          node.y = height / 2 + radius * Math.sin(angle)
        })

        currentAngle += arcLength
      })

      // Position nodes
      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`)

      // Position links
      link
        .attr("x1", (d: any) =>
          typeof d.source === "object" ? d.source.x : data.nodes.find((n) => n.id === d.source)?.x,
        )
        .attr("y1", (d: any) =>
          typeof d.source === "object" ? d.source.y : data.nodes.find((n) => n.id === d.source)?.y,
        )
        .attr("x2", (d: any) =>
          typeof d.target === "object" ? d.target.x : data.nodes.find((n) => n.id === d.target)?.x,
        )
        .attr("y2", (d: any) =>
          typeof d.target === "object" ? d.target.y : data.nodes.find((n) => n.id === d.target)?.y,
        )
    } else if (layout === "hierarchical") {
      try {
        // Hierarchical layout using a simpler approach to avoid cycles
        // Find a root node (seed or highest followers)
        const rootNode =
          data.nodes.find((node) => node.group === "seed") ||
          data.nodes.reduce((max, node) => (node.followers > max.followers ? node : max), data.nodes[0])

        // Create a simple tree structure using BFS to avoid cycles
        const visited = new Set<string>()
        const nodePositions = new Map<string, { x: number; y: number }>()
        const queue: { node: GraphNode; level: number; position: number }[] = [
          { node: rootNode, level: 0, position: 0 },
        ]

        // Track the number of nodes at each level for positioning
        const nodesPerLevel: number[] = []

        // BFS traversal
        while (queue.length > 0) {
          const { node, level, position } = queue.shift()!

          if (visited.has(node.id)) continue
          visited.add(node.id)

          // Initialize or update the count for this level
          if (!nodesPerLevel[level]) nodesPerLevel[level] = 0
          nodesPerLevel[level]++

          // Calculate position
          const levelWidth = width - 100
          const x = (position + 1) * (levelWidth / (nodesPerLevel[level] + 1))
          const y = level * 100 + 50

          nodePositions.set(node.id, { x, y })

          // Find children (nodes that this node connects to)
          const children = validLinks
            .filter((link) => {
              const sourceId = typeof link.source === "object" ? link.source.id : link.source
              return sourceId === node.id
            })
            .map((link) => {
              const targetId = typeof link.target === "object" ? link.target.id : link.target
              return data.nodes.find((n) => n.id === targetId)!
            })
            .filter((child) => !visited.has(child.id))

          // Add children to the queue
          children.forEach((child, i) => {
            queue.push({
              node: child,
              level: level + 1,
              position: i,
            })
          })
        }

        // For nodes not visited (disconnected), position them at the bottom
        const bottomLevel = nodesPerLevel.length
        let bottomPosition = 0

        data.nodes.forEach((node) => {
          if (!visited.has(node.id)) {
            const levelWidth = width - 100
            const x = (bottomPosition + 1) * (levelWidth / (data.nodes.length - visited.size + 1))
            const y = bottomLevel * 100 + 50

            nodePositions.set(node.id, { x, y })
            bottomPosition++
          }
        })

        // Update node positions
        data.nodes.forEach((node) => {
          const position = nodePositions.get(node.id)
          if (position) {
            node.x = position.x
            node.y = position.y
          } else {
            // Fallback position if not set
            node.x = width / 2
            node.y = height / 2
          }
        })

        // Position nodes
        node.attr("transform", (d: any) => `translate(${d.x},${d.y})`)

        // Position links
        link
          .attr("x1", (d: any) =>
            typeof d.source === "object" ? d.source.x : data.nodes.find((n) => n.id === d.source)?.x,
          )
          .attr("y1", (d: any) =>
            typeof d.source === "object" ? d.source.y : data.nodes.find((n) => n.id === d.source)?.y,
          )
          .attr("x2", (d: any) =>
            typeof d.target === "object" ? d.target.x : data.nodes.find((n) => n.id === d.target)?.x,
          )
          .attr("y2", (d: any) =>
            typeof d.target === "object" ? d.target.y : data.nodes.find((n) => n.id === d.target)?.y,
          )
      } catch (error) {
        console.error("Error creating hierarchical layout:", error)

        // Fallback to a simple grid layout
        const gridSize = Math.ceil(Math.sqrt(data.nodes.length))
        const cellWidth = width / gridSize
        const cellHeight = height / gridSize

        data.nodes.forEach((node, i) => {
          const row = Math.floor(i / gridSize)
          const col = i % gridSize
          node.x = col * cellWidth + cellWidth / 2
          node.y = row * cellHeight + cellHeight / 2
        })

        // Position nodes
        node.attr("transform", (d: any) => `translate(${d.x},${d.y})`)

        // Position links
        link
          .attr("x1", (d: any) =>
            typeof d.source === "object" ? d.source.x : data.nodes.find((n) => n.id === d.source)?.x,
          )
          .attr("y1", (d: any) =>
            typeof d.source === "object" ? d.source.y : data.nodes.find((n) => n.id === d.source)?.y,
          )
          .attr("x2", (d: any) =>
            typeof d.target === "object" ? d.target.x : data.nodes.find((n) => n.id === d.target)?.x,
          )
          .attr("y2", (d: any) =>
            typeof d.target === "object" ? d.target.y : data.nodes.find((n) => n.id === d.target)?.y,
          )
      }
    }
  }, [data, dimensions, onNodeClick, layout, nodeSizeMetric, nodeColorScheme, nodeAnalytics, communities])

  return <svg ref={svgRef} width="100%" height="100%" className="bg-gray-950" style={{ minHeight: "500px" }} />
}

// Helper functions to calculate centrality measures
function calculateDegreeCentrality(nodeId: string, links: any[]): number {
  let degree = 0
  for (const link of links) {
    const sourceId = typeof link.source === "object" ? link.source.id : link.source
    const targetId = typeof link.target === "object" ? link.target.id : link.target
    if (sourceId === nodeId || targetId === nodeId) {
      degree++
    }
  }
  return degree
}

function calculateBetweennessCentrality(nodeId: string, nodes: GraphNode[], links: any[]): number {
  // Simplified approximation
  const degree = calculateDegreeCentrality(nodeId, links)
  const totalNodes = nodes.length

  if (totalNodes <= 2) return 0

  return degree / (totalNodes - 1)
}

function calculateClosenessCentrality(nodeId: string, nodes: GraphNode[], links: any[]): number {
  // Simplified approximation
  const degree = calculateDegreeCentrality(nodeId, links)
  const totalNodes = nodes.length

  if (totalNodes <= 1) return 0

  return degree / (totalNodes - 1)
}

function calculateEngagement(nodeId: string, links: any[]): number {
  let engagement = 0
  for (const link of links) {
    const targetId = typeof link.target === "object" ? link.target.id : link.target
    if (targetId === nodeId) {
      engagement++
    }
  }
  return engagement
}

