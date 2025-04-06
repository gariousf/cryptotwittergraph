"use server"

import type { TwitterUser, TwitterFollowing, TwitterResponse, TwitterTweet } from "@/types/twitter"
import { cache } from "react"

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
    const response = await fetch(url.toString(), {
      headers: getAuthHeaders(),
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.status} ${response.statusText}`)
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
    await fetchFromTwitter("/users/me")
    return true
  } catch (error) {
    return false
  }
}

/**
 * Get user by username
 */
export const getUserByUsername = cache(async (username: string): Promise<TwitterUser | null> => {
  try {
    const response = await fetchFromTwitter<TwitterResponse<TwitterUser[]>>("/users/by", {
      usernames: username,
      "user.fields": "description,profile_image_url,public_metrics",
    })

    return response.data && response.data.length > 0 ? response.data[0] : null
  } catch (error) {
    console.error(`Error fetching user ${username}:`, error)
    return null
  }
})

/**
 * Get user's following (accounts they follow)
 */
export const getUserFollowing = cache(async (userId: string, maxResults = 100): Promise<TwitterUser[]> => {
  try {
    const response = await fetchFromTwitter<TwitterFollowing>(`/users/${userId}/following`, {
      max_results: maxResults.toString(),
      "user.fields": "description,profile_image_url,public_metrics",
    })

    return response.data || []
  } catch (error) {
    console.error(`Error fetching following for user ${userId}:`, error)
    return []
  }
})

/**
 * Get user's followers
 */
export const getUserFollowers = cache(async (userId: string, maxResults = 100): Promise<TwitterUser[]> => {
  try {
    const response = await fetchFromTwitter<TwitterFollowing>(`/users/${userId}/followers`, {
      max_results: maxResults.toString(),
      "user.fields": "description,profile_image_url,public_metrics",
    })

    return response.data || []
  } catch (error) {
    console.error(`Error fetching followers for user ${userId}:`, error)
    return []
  }
})

/**
 * Get user's recent tweets
 */
export const getUserTweets = cache(async (userId: string, maxResults = 100): Promise<TwitterTweet[]> => {
  try {
    const response = await fetchFromTwitter<TwitterResponse<TwitterTweet[]>>(`/users/${userId}/tweets`, {
      max_results: maxResults.toString(),
      "tweet.fields": "created_at,public_metrics,entities,referenced_tweets",
      "expansions": "referenced_tweets.id",
    })

    return response.data || []
  } catch (error) {
    console.error(`Error fetching tweets for user ${userId}:`, error)
    return []
  }
})

/**
 * Get tweets mentioning a username
 */
export const getMentioningTweets = cache(async (username: string, maxResults = 100): Promise<TwitterTweet[]> => {
  try {
    // Search for tweets mentioning the username
    const response = await fetchFromTwitter<TwitterResponse<TwitterTweet[]>>("/tweets/search/recent", {
      query: `@${username}`,
      max_results: maxResults.toString(),
      "tweet.fields": "created_at,author_id,entities,referenced_tweets,public_metrics",
    })

    return response.data || []
  } catch (error) {
    console.error(`Error fetching mentions for user ${username}:`, error)
    return []
  }
})

/**
 * Search for users by keyword
 */
export const searchUsers = cache(async (query: string, maxResults = 10): Promise<TwitterUser[]> => {
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
})

/**
 * Search for tweets by keyword
 */
export const searchTweets = cache(async (query: string, maxResults = 100): Promise<TwitterTweet[]> => {
  try {
    const response = await fetchFromTwitter<TwitterResponse<TwitterTweet[]>>("/tweets/search/recent", {
      query: query,
      max_results: maxResults.toString(),
      "tweet.fields": "created_at,author_id,entities,referenced_tweets,public_metrics",
    })

    return response.data || []
  } catch (error) {
    console.error(`Error searching tweets with query ${query}:`, error)
    return []
  }
})

/**
 * Get tweets by hashtag
 */
export const getTweetsByHashtag = cache(async (hashtag: string, maxResults = 100): Promise<TwitterTweet[]> => {
  // Remove # if present
  const cleanHashtag = hashtag.startsWith("#") ? hashtag.substring(1) : hashtag
  
  try {
    const response = await fetchFromTwitter<TwitterResponse<TwitterTweet[]>>("/tweets/search/recent", {
      query: `#${cleanHashtag}`,
      max_results: maxResults.toString(),
      "tweet.fields": "created_at,author_id,entities,referenced_tweets,public_metrics",
    })

    return response.data || []
  } catch (error) {
    console.error(`Error fetching tweets for hashtag ${hashtag}:`, error)
    return []
  }
})

