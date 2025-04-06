"use server"

import {
  getUserByUsername,
  getUserFollowing,
  getUserFollowers,
  checkTwitterCredentials,
  getUserTweets,
} from "./twitter-api"
import { getSampleGraphData } from "./sample-data"
import { processUserConnections } from "./connection-service"
import type { GraphData, GraphNode, GraphLink, TwitterUser } from "@/types/twitter"
import { calculateKolScore, isLikelyKol } from "./kol-service"
import { cache } from "react"
import { analyzeTweetsSentiment } from "./sentiment-service"

// Cache the graph data to avoid redundant API calls
export const getGraphData = cache(async (seedUsername: string, depth = 1): Promise<GraphData> => {
  try {
    // Check if Twitter API credentials are valid
    const credentialsValid = await checkTwitterCredentials()

    if (!credentialsValid) {
      console.log("Twitter API credentials are invalid, using sample data")
      return validateGraphData(getSampleGraphData(seedUsername))
    }

    const nodes: GraphNode[] = []
    const links: GraphLink[] = []
    const processedUserIds = new Set<string>()

    // Start with the seed user
    const seedUser = await getUserByUsername(seedUsername)
    if (!seedUser) {
      console.log(`User ${seedUsername} not found, using sample data`)
      return validateGraphData(getSampleGraphData(seedUsername))
    }

    // Add seed user to nodes
    addUserToNodes(seedUser, nodes, "seed", undefined)
    processedUserIds.add(seedUser.id)

    // Process the network at the specified depth
    await processUserNetwork(seedUser.id, seedUser.username, depth, nodes, links, processedUserIds)

    return validateGraphData({ nodes, links })
  } catch (error) {
    console.error("Error fetching graph data:", error)
    console.log("Falling back to sample data")
    return validateGraphData(getSampleGraphData(seedUsername))
  }
})

// Process a user's network (following and followers)
async function processUserNetwork(
  userId: string,
  username: string,
  depth: number,
  nodes: GraphNode[],
  links: GraphLink[],
  processedUserIds: Set<string>,
  currentDepth = 0,
) {
  if (currentDepth >= depth) return

  // Get accounts the user follows
  const following = await getUserFollowing(userId)

  // Get user's tweets and analyze sentiment
  const userTweets = await getUserTweets(userId)
  let sentimentData = undefined

  if (userTweets.length > 0) {
    const sentimentAnalysis = analyzeTweetsSentiment(userTweets)
    sentimentData = {
      averageScore: sentimentAnalysis.averageScore,
      type:
        sentimentAnalysis.averageScore < -5
          ? "very-negative"
          : sentimentAnalysis.averageScore < -1
            ? "negative"
            : sentimentAnalysis.averageScore < 1
              ? "neutral"
              : sentimentAnalysis.averageScore < 5
                ? "positive"
                : "very-positive",
      distribution: sentimentAnalysis.sentimentDistribution,
    }
  }

  // Process each following
  for (const followedUser of following) {
    // Add user to nodes if not already processed
    if (!processedUserIds.has(followedUser.id)) {
      addUserToNodes(followedUser, nodes, determineUserGroup(followedUser), undefined)
      processedUserIds.add(followedUser.id)
    }

    // Add follow link from user to followed user
    links.push({
      source: userId,
      target: followedUser.id,
      value: 5, // Default value
      type: "follows",
    })

    // Process this user's network if we haven't reached max depth
    if (currentDepth + 1 < depth) {
      await processUserNetwork(
        followedUser.id,
        followedUser.username,
        depth,
        nodes,
        links,
        processedUserIds,
        currentDepth + 1,
      )
    }
  }

  // If we're at depth 0 (seed user), also get followers and other interactions
  if (currentDepth === 0) {
    const followers = await getUserFollowers(userId)

    // Process each follower
    for (const follower of followers) {
      // Add user to nodes if not already processed
      if (!processedUserIds.has(follower.id)) {
        addUserToNodes(follower, nodes, determineUserGroup(follower), undefined)
        processedUserIds.add(follower.id)
      }

      // Add follow link from follower to user
      links.push({
        source: follower.id,
        target: userId,
        value: 3, // Default value
        type: "follows",
      })
    }

    // Process other interaction types (mentions, retweets, etc.)
    try {
      const interactionLinks = await processUserConnections(userId, username, links)

      // Add any new links that weren't already in the links array
      for (const link of interactionLinks) {
        if (!links.some((l) => l.source === link.source && l.target === link.target && l.type === link.type)) {
          links.push(link)
        }
      }
    } catch (error) {
      console.error("Error processing interaction links:", error)
    }
  }
}

// Add a Twitter user to the nodes array
function addUserToNodes(user: TwitterUser, nodes: GraphNode[], group: string, sentiment?: any) {
  // Calculate KOL score if the user is in the KOL group
  const kolRank = group === "kol" ? calculateKolScore(user) : undefined

  nodes.push({
    id: user.id,
    name: user.name,
    username: user.username,
    group,
    followers: user.public_metrics?.followers_count || 0,
    imageUrl: user.profile_image_url,
    description: user.description,
    kolRank,
    sentiment,
  })
}

// Determine the group of a user based on their profile
function determineUserGroup(user: TwitterUser): string {
  // Check if user is likely a KOL
  if (isLikelyKol(user)) {
    return "kol"
  }

  const description = (user.description || "").toLowerCase()
  const name = user.name.toLowerCase()
  const username = user.username.toLowerCase()

  // Check for project indicators
  if (
    description.includes("blockchain") ||
    description.includes("protocol") ||
    description.includes("network") ||
    description.includes("chain")
  ) {
    return "project"
  }

  // Check for DAO indicators
  if (description.includes("dao") || name.includes("dao") || username.includes("dao")) {
    return "dao"
  }

  // Check for investor indicators
  if (
    description.includes("investor") ||
    description.includes("capital") ||
    description.includes("ventures") ||
    description.includes("investing")
  ) {
    return "investor"
  }

  // Check for company indicators
  if (
    description.includes("exchange") ||
    description.includes("trading") ||
    description.includes("company") ||
    description.includes("platform")
  ) {
    return "company"
  }

  // Default to influencer
  return "influencer"
}

// Filter out links that reference non-existent nodes
function validateGraphData(data: GraphData): GraphData {
  const nodeIds = new Set(data.nodes.map((node) => node.id))

  const validLinks = data.links.filter((link) => {
    const sourceId = typeof link.source === "object" ? link.source.id : link.source
    const targetId = typeof link.target === "object" ? link.target.id : link.target
    return nodeIds.has(sourceId) && nodeIds.has(targetId)
  })

  return {
    nodes: data.nodes,
    links: validLinks,
  }
}

