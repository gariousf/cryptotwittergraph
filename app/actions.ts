"use server"

import { getGraphData } from "@/lib/graph-service"
import { getSampleGraphData } from "@/lib/sample-data"
import type { GraphData } from "@/types/twitter"

export async function fetchTwitterGraph(
  username: string,
  depth = 1,
): Promise<{ data: GraphData; usingSampleData: boolean }> {
  try {
    // Remove @ if present
    const cleanUsername = username.startsWith("@") ? username.substring(1) : username

    // Get graph data
    const graphData = await getGraphData(cleanUsername, depth)

    // Check if we're using sample data (if nodes have string IDs like "vitalik" instead of numeric Twitter IDs)
    const usingSampleData = graphData.nodes.length > 0 && graphData.nodes.some((node) => isNaN(Number(node.id)))

    return {
      data: graphData,
      usingSampleData,
    }
  } catch (error) {
    console.error("Error fetching Twitter graph:", error)
    console.log("Falling back to sample data")

    return {
      data: getSampleGraphData(username),
      usingSampleData: true,
    }
  }
}

