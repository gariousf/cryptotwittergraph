import type { GraphLink, ConnectionType } from "@/types/twitter"
import { getUserTweets, getMentioningTweets } from "./twitter-api"

// Process tweets to extract connections
export async function processUserConnections(
  userId: string,
  username: string,
  existingLinks: GraphLink[] = [],
): Promise<GraphLink[]> {
  const connections: GraphLink[] = [...existingLinks]
  const processedInteractions = new Map<string, Set<string>>()

  try {
    // Get user's recent tweets
    const userTweets = await getUserTweets(userId, 50)

    // Process outgoing connections (user mentioning, retweeting others)
    for (const tweet of userTweets) {
      // Process mentions
      if (tweet.entities?.mentions) {
        for (const mention of tweet.entities.mentions) {
          const key = `${userId}-${mention.id}-mentioned`
          if (!processedInteractions.has(key)) {
            processedInteractions.set(key, new Set())
          }

          processedInteractions.get(key)?.add(tweet.id)

          // Only add if this is a new interaction or we're updating an existing one
          if (processedInteractions.get(key)?.size === 1) {
            connections.push({
              source: userId,
              target: mention.id,
              type: "mentioned",
              value: 3,
              timestamp: tweet.created_at,
              count: 1,
            })
          } else {
            // Update existing connection
            const existingIdx = connections.findIndex(
              (c) => c.source === userId && c.target === mention.id && c.type === "mentioned",
            )
            if (existingIdx >= 0) {
              connections[existingIdx].count = (connections[existingIdx].count || 1) + 1
              connections[existingIdx].value = Math.min(8, 3 + Math.log(connections[existingIdx].count || 1))
            }
          }
        }
      }

      // Process retweets and quotes
      if (tweet.referenced_tweets) {
        for (const refTweet of tweet.referenced_tweets) {
          if (refTweet.type === "retweeted" || refTweet.type === "quoted") {
            const connectionType: ConnectionType = refTweet.type === "retweeted" ? "retweeted" : "quoted"
            const key = `${userId}-${refTweet.id}-${connectionType}`

            if (!processedInteractions.has(key)) {
              processedInteractions.set(key, new Set())
            }

            processedInteractions.get(key)?.add(tweet.id)

            // We don't have the author ID directly, so we'll use a placeholder
            // In a real implementation, you'd resolve this with the expansions data
            const targetId = `tweet-${refTweet.id}`

            if (processedInteractions.get(key)?.size === 1) {
              connections.push({
                source: userId,
                target: targetId,
                type: connectionType,
                value: connectionType === "retweeted" ? 4 : 5,
                timestamp: tweet.created_at,
                count: 1,
              })
            } else {
              // Update existing connection
              const existingIdx = connections.findIndex(
                (c) => c.source === userId && c.target === targetId && c.type === connectionType,
              )
              if (existingIdx >= 0) {
                connections[existingIdx].count = (connections[existingIdx].count || 1) + 1
                connections[existingIdx].value = Math.min(
                  8,
                  (connectionType === "retweeted" ? 4 : 5) + Math.log(connections[existingIdx].count || 1),
                )
              }
            }
          }
        }
      }
    }

    // Get tweets mentioning the user
    const mentioningTweets = await getMentioningTweets(username, 50)

    // Process incoming connections (others mentioning the user)
    for (const tweet of mentioningTweets) {
      const sourceId = tweet.author_id
      if (!sourceId) continue

      // Skip if it's the user mentioning themselves
      if (sourceId === userId) continue

      const key = `${sourceId}-${userId}-mentioned`
      if (!processedInteractions.has(key)) {
        processedInteractions.set(key, new Set())
      }

      processedInteractions.get(key)?.add(tweet.id)

      if (processedInteractions.get(key)?.size === 1) {
        connections.push({
          source: sourceId,
          target: userId,
          type: "mentioned",
          value: 3,
          timestamp: tweet.created_at,
          count: 1,
        })
      } else {
        // Update existing connection
        const existingIdx = connections.findIndex(
          (c) => c.source === sourceId && c.target === userId && c.type === "mentioned",
        )
        if (existingIdx >= 0) {
          connections[existingIdx].count = (connections[existingIdx].count || 1) + 1
          connections[existingIdx].value = Math.min(8, 3 + Math.log(connections[existingIdx].count || 1))
        }
      }
    }
  } catch (error) {
    console.error("Error processing user connections:", error)
  }

  return connections
}

