"use server"

import type { TwitterUser, TwitterFollowing, TwitterResponse, TwitterTweet } from "@/types/twitter"
import { cache } from "react"
import { checkRateLimit, updateRateLimitState } from './rate-limiter'; // Import helpers

// Twitter API v2 base URL
const TWITTER_API_BASE = "https://api.twitter.com/2"

/**
 * Get authenticated headers for Twitter API requests
 */
function getAuthHeaders() {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN // Only uses the Bearer Token

  if (!bearerToken) {
    console.error("TWITTER_BEARER_TOKEN is not defined in environment variables")
    throw new Error("Twitter API credentials are missing")
  }

  return {
    Authorization: `Bearer ${bearerToken}`, // Sends the Bearer Token
  }
}

/**
 * Fetch data from Twitter API
 */
async function fetchFromTwitter<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  // --- Rate Limit Check ---
  await checkRateLimit(endpoint); // Wait if necessary before making the request
  // ------------------------

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

    // --- Rate Limit State Update ---
    updateRateLimitState(endpoint, response.headers); // Update state regardless of status code
    // -----------------------------

    if (!response.ok) {
      let errorData: any = null;
      try {
        errorData = await response.json();
        console.error("Twitter API Error Response Body:", JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.error("Could not parse error response body:", await response.text());
      }

      // Check specifically for 429 Too Many Requests
      if (response.status === 429) {
        console.error(`Twitter API Rate Limit Exceeded: ${endpoint}`);
        // The checkRateLimit should ideally prevent this, but if it happens (e.g., race condition),
        // throw a specific error or handle retry logic here if desired.
        // For now, just throw the generic error.
      }

      const errorTitle = errorData?.title || `HTTP Error ${response.status}`;
      const errorDetail = errorData?.detail || response.statusText;
      // Add specific handling for common errors if needed
      // if (errorData?.type?.includes("resource-not-found")) { ... }

      throw new Error(`Twitter API error: ${response.status} ${errorTitle} - ${errorDetail}`);
    }

    // Handle cases where response might be empty (e.g., DELETE requests)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return {} as T; // Return an empty object or null based on expected type
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
    const response = await fetchFromTwitter<TwitterResponse<TwitterTweet[]>>("/users/${userId}/tweets", {
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
export const searchTweets = cache(async (
  query: string,
  maxResultsPerPage = 100, // Max per page for recent search
  maxTotalResults = 500 // Example: Fetch up to 5 pages
): Promise<TwitterTweet[]> => {
  let allTweets: TwitterTweet[] = [];
  let nextToken: string | undefined = undefined;
  let fetchedCount = 0;

  try {
    do {
      const params: Record<string, string> = {
        query: query,
        max_results: Math.min(maxResultsPerPage, maxTotalResults - fetchedCount).toString(),
        "tweet.fields": "created_at,author_id,entities,referenced_tweets,public_metrics",
      };
      if (nextToken) {
        params.pagination_token = nextToken;
      }

      // Assume fetchFromTwitter is modified to return the full response including meta
      const response = await fetchFromTwitter<TwitterResponse<TwitterTweet[]>>("/tweets/search/recent", params);

      if (response.data) {
        allTweets = allTweets.concat(response.data);
        fetchedCount += response.data.length;
      }

      nextToken = response.meta?.next_token;

    } while (nextToken && fetchedCount < maxTotalResults);

    return allTweets;

  } catch (error) {
    console.error(`Error searching tweets with query ${query}:`, error);
    // Return whatever has been fetched so far, or empty array
    return allTweets.length > 0 ? allTweets : [];
  }
});

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

