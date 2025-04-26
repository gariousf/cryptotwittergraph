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
import type { DiscussionSummary, EnhancedEntity } from '@/types/nlp'
import type { FullSentimentAnalysisResult } from './sentiment-service'
import { performFullSentimentAnalysis } from './sentiment-service'

const NLP_API_URL = process.env.NLP_MICROSERVICE_URL; // Get URL from env

/**
 * Process tweets for topic detection
 */
export async function processTweetsForTopicDetection(
  tweets: TwitterTweet[],
  windowSize: number = 60
): Promise<void> {
  console.log(`Processing ${tweets.length} tweets for topic detection...`)
  // Group tweets by time window
  const windows = groupTweetsByTimeWindow(tweets, windowSize)
  
  // Process each window
  for (const [windowKey, windowTweets] of Object.entries(windows)) {
    console.log(`Processing window: ${windowKey} with ${windowTweets.length} tweets.`)
    // --- Perform Full NLP Analysis via Microservice ---
    const analyzedTweets: (TwitterTweet & { nlpAnalysis?: FullSentimentAnalysisResult, entities?: EnhancedEntity[] })[] = await Promise.all(
        windowTweets.map(async (tweet) => {
             try {
                // Call the combined endpoint (assuming /analyze_text returns all needed info)
                const analysisResult = await callNlpService<{
                    sentiment: SentimentResult;
                    emotions: DetectedEmotion[];
                    aspects: AspectSentiment[];
                    entities: EnhancedEntity[];
                }>('/analyze_text', { text: tweet.text });

                if (analysisResult) {
                     // Reconstruct FullSentimentAnalysisResult
                     const fullResult: FullSentimentAnalysisResult = {
                         score: analysisResult.sentiment.score,
                         comparative: analysisResult.sentiment.comparative,
                         type: analysisResult.sentiment.type,
                         positiveWords: analysisResult.sentiment.positive,
                         negativeWords: analysisResult.sentiment.negative,
                         emotions: analysisResult.emotions,
                         aspects: analysisResult.aspects,
                         // You might derive dominant emotion/aspect here or expect it from the service
                     };
                     return { ...tweet, nlpAnalysis: fullResult, entities: analysisResult.entities };
                } else {
                     // Fallback: Store null or basic sentiment if API fails
                     const basicSentiment = await analyzeSentiment(tweet.text); // Local fallback
                     return { ...tweet, nlpAnalysis: { ...basicSentiment, positiveWords: basicSentiment.positive, negativeWords: basicSentiment.negative, emotions: [], aspects: [] } , entities: [] };
                }
             } catch (error) {
                 console.error(`Error analyzing tweet ${tweet.id}:`, error)
                 const basicSentiment = await analyzeSentiment(tweet.text); // Local fallback
                return { ...tweet, nlpAnalysis: { ...basicSentiment, positiveWords: basicSentiment.positive, negativeWords: basicSentiment.negative, emotions: [], aspects: [] }, entities: [] }; // Return with basic sentiment on error
             }
        })
    )

    // Save window with analyzed tweets
    await saveWindow(windowKey, analyzedTweets) // Save enriched tweets
    
    // Get previous window (which should also contain analyzed tweets if processed before)
    const windowKeys = await getWindowKeys()
    const currentIndex = windowKeys.indexOf(windowKey)
    const previousKey = currentIndex > 0 ? windowKeys[currentIndex - 1] : null
    const previousWindowAnalyzed = previousKey ? await getWindow(previousKey) : null // Fetch previous analyzed window
    
    // Mine association rules (using hashtags from original text or extracted entities)
    const rules = mineAssociationRules(analyzedTweets) // Pass analyzed tweets
    await saveRules(windowKey, rules)
    
    // Mine high utility patterns (needs adaptation based on what constitutes 'utility' now - e.g., sentiment score, emotion intensity?)
    // This requires revisiting the HUPM logic. For now, pass analyzed tweets.
    const patterns = mineHighUtilityPatterns(analyzedTweets, previousWindowAnalyzed)
    await savePatterns(windowKey, patterns)
    
    // Detect rule changes (pass analyzed tweets)
    const changes = detectRuleChanges(analyzedTweets, previousWindowAnalyzed)
    await saveRuleChanges(windowKey, changes)
  }
   console.log("Finished processing tweets for topic detection.")
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
  topic: string // Could be hashtag or extracted entity
): Promise<{
  dates: string[],
  frequencies: number[],
  associations: Record<string, number>[],
  sentimentScores: number[], // Add sentiment timeline
  dominantEmotions: (CryptoEmotion | undefined)[] // Add emotion timeline
}> => {
  const windowKeys = await getWindowKeys()
  const timeline = {
    dates: [] as string[],
    frequencies: [] as number[],
    associations: [] as Record<string, number>[],
    sentimentScores: [] as number[],
    dominantEmotions: [] as (CryptoEmotion | undefined)[]
  }
  
  for (const windowKey of windowKeys) {
    const analyzedTweets = await getWindow(windowKey) as (TwitterTweet & { nlpAnalysis?: FullSentimentAnalysisResult, entities?: EnhancedEntity[] })[]
    const rules = await getRules(windowKey)
    
    let frequency = 0
    let windowTotalScore = 0
    let tweetsInScore = 0
    const windowEmotions: Record<CryptoEmotion, number> = {} as any

    analyzedTweets.forEach((tweet) => {
      // Check if topic matches hashtag OR extracted entity
      const hashtags = extractHashtags(tweet.text) // Keep original hashtag check
      const entitiesMatch = tweet.entities?.some(e => (e.normalizedText || e.text).toLowerCase() === topic.toLowerCase())
      const hashtagMatch = hashtags.some(tag => tag.toLowerCase() === `#${topic.toLowerCase()}`)

      if (entitiesMatch || hashtagMatch) {
        frequency++
        if (tweet.nlpAnalysis) {
          windowTotalScore += tweet.nlpAnalysis.score
          tweetsInScore++
          tweet.nlpAnalysis.emotions?.forEach(emo => {
            windowEmotions[emo.emotion] = (windowEmotions[emo.emotion] || 0) + emo.score
          })
        }
      }
    })

    const windowAvgSentiment = tweetsInScore > 0 ? windowTotalScore / tweetsInScore : 0
    const dominantEmotion = Object.keys(windowEmotions).length > 0
      ? (Object.keys(windowEmotions) as CryptoEmotion[]).sort((a,b) => windowEmotions[b] - windowEmotions[a])[0]
      : undefined

    // Find associations (Logic might need update based on rules using entities)
    const associations: Record<string, number> = {}
    rules.forEach(rule => {
      // Check if topic is in antecedent or consequent (using lower case comparison)
      const topicLower = topic.toLowerCase()
      if (rule.antecedent.some(item => item.toLowerCase() === topicLower)) {
        rule.consequent.forEach(item => {
          if(item.toLowerCase() !== topicLower) associations[item] = (associations[item] || 0) + rule.confidence
        })
      }
      if (rule.consequent.some(item => item.toLowerCase() === topicLower)) {
        rule.antecedent.forEach(item => {
          if(item.toLowerCase() !== topicLower) associations[item] = (associations[item] || 0) + rule.confidence
        })
      }
    })
    
    // Format date
    const date = new Date(windowKey).toLocaleDateString()
    
    timeline.dates.push(date)
    timeline.frequencies.push(frequency)
    timeline.associations.push(associations)
    timeline.sentimentScores.push(windowAvgSentiment)
    timeline.dominantEmotions.push(dominantEmotion)
  }
  
  return timeline
})

/**
 * Extracts crypto entities by calling the NLP microservice.
 * Note: If /analyze_text returns entities, this might not be needed separately.
 *       Keeping it separate allows for potentially different models or logic.
 */
async function extractCryptoEntities(text: string): Promise<EnhancedEntity[]> {
     console.log(`Requesting entity extraction for: "${text.substring(0, 50)}..."`);
     // Decide if this should be part of /analyze_text or a separate endpoint like /entities
     const result = await callNlpService<{ entities: EnhancedEntity[] }>('/entities', { text });
     return result?.entities ?? []; // Return empty array on failure
}

/**
 * Generates a summary by calling the NLP microservice.
 */
export const summarizeTopicDiscussion = cache(async (
    tweets: TwitterTweet[], // Pass original tweets
    topic: string
): Promise<DiscussionSummary | null> => {
    if (!tweets || tweets.length === 0) return null;
    console.log(`Requesting summary for topic: ${topic} with ${tweets.length} tweets.`);

     // Prepare texts for the API call
     const texts = tweets.map(t => t.text);

    const summaryResult = await callNlpService<DiscussionSummary>('/summarize', { texts, topic });

    if (!summaryResult) {
        console.warn(`Summarization failed for topic ${topic}.`);
        // Return a basic fallback summary or null
        return {
             keyPoints: ["Summarization failed."],
             overallSentiment: { score: 0, type: 'neutral', comparative: 0, positive:[], negative: []},
             influentialTweets: [],
             keyEntities: [],
        };
    }

    return summaryResult;
});

// --- Helper function (used by sentiment-service modification) ---
async function callNlpService<T>(endpoint: string, body: any): Promise<T | null> {
     if (!NLP_API_URL) {
         console.error("NLP_MICROSERVICE_URL environment variable is not set.");
         return null;
     }
     try {
         const response = await fetch(`${NLP_API_URL}${endpoint}`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(body),
         });
         if (!response.ok) {
             console.error(`NLP service error (${response.status}) for ${endpoint}: ${await response.text()}`);
             return null;
         }
         return await response.json() as T;
     } catch (error) {
         console.error(`Failed to fetch from NLP service (${endpoint}):`, error);
         return null;
     }
 }
