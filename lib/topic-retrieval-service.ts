"use server"

import { cache } from "react"
import type { TwitterTweet } from "@/types/twitter"
import { findRelatedTweets, findTrendingTopics } from "./semantic-search"
import { mineAssociationRules } from "./association-rule-mining"
import { getRules, getWindow, getWindowKeys } from "./db-service"

/**
 * Retrieve tweets related to a specific topic
 */
export const retrieveTopicTweets = cache(async (
  topic: string,
  limit: number = 20
): Promise<{
  tweets: TwitterTweet[],
  relatedTopics: string[]
}> => {
  // Get the most recent window
  const windowKeys = await getWindowKeys()
  if (windowKeys.length === 0) {
    return { tweets: [], relatedTopics: [] }
  }
  
  const latestKey = windowKeys[windowKeys.length - 1]
  
  // Get tweets and rules for the latest window
  const tweets = await getWindow(latestKey)
  const rules = await getRules(latestKey)
  
  // Find related tweets
  const relatedTweets = await findRelatedTweets(tweets, topic, rules, limit)
  
  // Extract related topics from rules
  const relatedTopics = new Set<string>()
  
  rules.forEach(rule => {
    // If topic is in antecedent, add consequents as related
    if (rule.antecedent.some(term => term.toLowerCase() === topic.toLowerCase())) {
      rule.consequent.forEach(term => relatedTopics.add(term))
    }
    
    // If topic is in consequent, add antecedents as related
    if (rule.consequent.some(term => term.toLowerCase() === topic.toLowerCase())) {
      rule.antecedent.forEach(term => relatedTopics.add(term))
    }
  })
  
  return {
    tweets: relatedTweets,
    relatedTopics: Array.from(relatedTopics)
  }
})

/**
 * Retrieve trending topics from recent tweets
 */
export const retrieveTrendingTopics = cache(async (
  limit: number = 10
): Promise<Array<{
  topic: string,
  score: number,
  relatedTerms: string[]
}>> => {
  // Get the most recent window
  const windowKeys = await getWindowKeys()
  if (windowKeys.length === 0) {
    return []
  }
  
  const latestKey = windowKeys[windowKeys.length - 1]
  
  // Get tweets and rules for the latest window
  const tweets = await getWindow(latestKey)
  const rules = await getRules(latestKey)
  
  // Find trending topics
  return findTrendingTopics(tweets, rules, limit)
})

/**
 * Search for tweets and analyze topics
 */
export async function searchAndAnalyzeTopics(
  query: string,
  tweets: TwitterTweet[]
): Promise<{
  relatedTweets: TwitterTweet[],
  topics: Array<{
    topic: string,
    score: number,
    relatedTerms: string[]
  }>
}> {
  // Mine association rules from the tweets
  const rules = mineAssociationRules(tweets, 0.01, 0.3)
  
  // Find related tweets for the query
  const relatedTweets = await findRelatedTweets(tweets, query, rules, 50)
  
  // Find trending topics from the tweets
  const topics = await findTrendingTopics(tweets, rules, 10)
  
  return {
    relatedTweets,
    topics
  }
} 