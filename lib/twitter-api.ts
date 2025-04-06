"use server"

import type { TwitterUser, TwitterFollowing, TwitterResponse, TwitterTweet } from "@/types/twitter"

// Twitter API v2 base URL
const TWITTER_API_BASE = "https://api.twitter.com/2"

/**
 * Get authenticated headers for Twitter API requests
 */
function getAuthHeaders() {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN

  if (!bearerToken) {
    console.error("TWITTER_BEARER_TOKEN is not defined in environment variables")
    throw new Error("Twitter API credentials are missing")
  }

  return {
    Authorization: `Bearer ${bearerToken}`,
  }
}

/**
 * Fetch data from Twitter API
 */
async function fetchFromTwitter<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${TWITTER_API_BASE}${endpoint}`)

  // Add query parameters
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value)
  })

  try {
    console.log(`Fetching from Twitter API: ${url.toString()}`)

    const response = await fetch(url.toString(), {
      headers: getAuthHeaders(),
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Twitter API error (${response.status}):`, errorText)
      throw new Error(`Twitter API error (${response.status}): ${errorText}`)
    }

    return response.json()
  } catch (error) {
    console.error("Error fetching from Twitter API:", error)
    throw error
  }
}

/**
 * Check if Twitter API credentials are valid
 */
export async function checkTwitterCredentials(): Promise<boolean> {
  try {
    // Try to fetch a simple endpoint to check if credentials are valid
    await fetchFromTwitter<any>("/users/me")
    return true
  } catch (error) {
    console.error("Twitter API credentials check failed:", error)
    return false
  }
}

/**
 * Get user by username
 */
export async function getUserByUsername(username: string): Promise<TwitterUser | null> {
  try {
    const response = await fetchFromTwitter<TwitterResponse<TwitterUser>>(`/users/by/username/${username}`, {
      "user.fields": "description,profile_image_url,public_metrics",
    })

    return response.data
  } catch (error) {
    console.error(`Error fetching user ${username}:`, error)
    return null
  }
}

/**
 * Get user's following (accounts they follow)
 */
export async function getUserFollowing(userId: string, maxResults = 100): Promise<TwitterUser[]> {
  try {
    const response = await fetchFromTwitter<TwitterResponse<TwitterFollowing>>(`/users/${userId}/following`, {
      max_results: maxResults.toString(),
      "user.fields": "description,profile_image_url,public_metrics",
    })

    return response.data
  } catch (error) {
    console.error(`Error fetching following for user ${userId}:`, error)
    return []
  }
}

/**
 * Get user's followers
 */
export async function getUserFollowers(userId: string, maxResults = 100): Promise<TwitterUser[]> {
  try {
    const response = await fetchFromTwitter<TwitterResponse<TwitterFollowing>>(`/users/${userId}/followers`, {
      max_results: maxResults.toString(),
      "user.fields": "description,profile_image_url,public_metrics",
    })

    return response.data
  } catch (error) {
    console.error(`Error fetching followers for user ${userId}:`, error)
    return []
  }
}

/**
 * Get recent tweets by user
 */
export async function getUserTweets(userId: string, maxResults = 100): Promise<TwitterTweet[]> {
  try {
    const response = await fetchFromTwitter<TwitterResponse<TwitterTweet[]>>(`/users/${userId}/tweets`, {
      max_results: maxResults.toString(),
      "tweet.fields": "created_at,entities,referenced_tweets,public_metrics,context_annotations",
      expansions: "referenced_tweets.id,referenced_tweets.id.author_id",
    })

    return response.data || []
  } catch (error) {
    console.error(`Error fetching tweets for user ${userId}:`, error)
    return []
  }
}

/**
 * Get tweets mentioning a user
 */
export async function getMentioningTweets(username: string, maxResults = 100): Promise<TwitterTweet[]> {
  try {
    // Search for tweets mentioning the username
    const response = await fetchFromTwitter<TwitterResponse<TwitterTweet[]>>("/tweets/search/recent", {
      query: `@${username}`,
      max_results: maxResults.toString(),
      "tweet.fields": "created_at,author_id,entities,referenced_tweets",
    })

    return response.data || []
  } catch (error) {
    console.error(`Error fetching mentions for user ${username}:`, error)
    return []
  }
}

/**
 * Search for users by keyword
 */
export async function searchUsers(query: string, maxResults = 10): Promise<TwitterUser[]> {
  try {
    const response = await fetchFromTwitter<TwitterResponse<TwitterUser[]>>("/users/search", {
      query: query,
      max_results: maxResults.toString(),
      "user.fields": "description,profile_image_url,public_metrics",
    })

    return response.data || []
  } catch (error) {
    console.error(`Error searching users with query ${query}:`, error)
    return []
  }
}

