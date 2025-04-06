"use server"

import { cache } from "react"
import { groupTweetsByTimeWindow } from "./hashtag-utils"
import { mineAssociationRules } from "./association-rule-mining"
import { mineHighUtilityPatterns } from "./high-utility-pattern-mining"
import { detectRuleChanges } from "./transaction-rule-change-mining"
import { 
  savePatterns, 
  saveRules, 
  saveRuleChanges, 
  saveWindow,
  getWindow,
  getWindowKeys,
  getPatterns,
  getRuleChanges
} from "./db-service"
import type { TwitterTweet } from "@/types/twitter"

/**
 * Process tweets for topic detection
 */
export async function processTweetsForTopicDetection(
  tweets: TwitterTweet[],
  windowSize: number = 60
): Promise<void> {
  // Group tweets by time window
  const windows = groupTweetsByTimeWindow(tweets, windowSize)
  
  // Process each window
  for (const [windowKey, windowTweets] of Object.entries(windows)) {
    // Save window
    await saveWindow(windowKey, windowTweets)
    
    // Get previous window
    const windowKeys = await getWindowKeys()
    const currentIndex = windowKeys.indexOf(windowKey)
    const previousKey = currentIndex > 0 ? windowKeys[currentIndex - 1] : null
    const previousWindow = previousKey ? await getWindow(previousKey) : null
    
    // Mine association rules
    const rules = mineAssociationRules(windowTweets)
    await saveRules(windowKey, rules)
    
    // Mine high utility patterns
    const patterns = mineHighUtilityPatterns(windowTweets, previousWindow)
    await savePatterns(windowKey, patterns)
    
    // Detect rule changes
    const changes = detectRuleChanges(windowTweets, previousWindow)
    await saveRuleChanges(windowKey, changes)
  }
}

/**
 * Get emerging topics
 */
export const getEmergingTopics = cache(async (
  limit: number = 10
): Promise<{
  patterns: any[],
  rules: any[]
}> => {
  // Get the most recent window
  const windowKeys = await getWindowKeys()
  if (windowKeys.length === 0) {
    return { patterns: [], rules: [] }
  }
  
  const latestKey = windowKeys[windowKeys.length - 1]
  
  // Get patterns and changes for the latest window
  const patterns = await getPatterns(latestKey)
  const changes = await getRuleChanges(latestKey)
  
  // Filter emerging patterns and rules
  const emergingPatterns = patterns
    .sort((a, b) => b.utility - a.utility)
    .slice(0, limit)
  
  const emergingRules = changes
    .filter(change => change.changeType === 'emerging' || change.changeType === 'new')
    .sort((a, b) => b.growthRate - a.growthRate)
    .slice(0, limit)
    .map(change => change.rule)
  
  return {
    patterns: emergingPatterns,
    rules: emergingRules
  }
})

/**
 * Get topic timeline
 */
export const getTopicTimeline = cache(async (
  hashtag: string
): Promise<{
  dates: string[],
  frequencies: number[],
  associations: Record<string, number>[]
}> => {
  const windowKeys = await getWindowKeys()
  const timeline = {
    dates: [] as string[],
    frequencies: [] as number[],
    associations: [] as Record<string, number>[]
  }
  
  for (const windowKey of windowKeys) {
    const tweets = await getWindow(windowKey)
    const rules = await getRules(windowKey)
    
    // Count hashtag frequency
    let frequency = 0
    tweets.forEach((tweet: any) => {
      const hashtags = tweet.text.match(/#(\w+)/g) || []
      if (hashtags.some(tag => tag.toLowerCase() === `#${hashtag.toLowerCase()}`)) {
        frequency++
      }
    })
    
    // Find associations
    const associations: Record<string, number> = {}
    rules.forEach(rule => {
      // Check if hashtag is in antecedent
      if (rule.antecedent.some(item => item.toLowerCase() === hashtag.toLowerCase())) {
        rule.consequent.forEach(item => {
          associations[item] = (associations[item] || 0) + rule.confidence
        })
      }
      
      // Check if hashtag is in consequent
      if (rule.consequent.some(item => item.toLowerCase() === hashtag.toLowerCase())) {
        rule.antecedent.forEach(item => {
          associations[item] = (associations[item] || 0) + rule.confidence
        })
      }
    })
    
    // Format date
    const date = new Date(windowKey).toLocaleDateString()
    
    timeline.dates.push(date)
    timeline.frequencies.push(frequency)
    timeline.associations.push(associations)
  }
  
  return timeline
}) 