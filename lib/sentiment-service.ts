"use server"

import Sentiment from "sentiment"
import type { TwitterTweet } from "@/types/twitter"
import { cache } from "react"

// Initialize sentiment analyzer
const sentiment = new Sentiment()

// Add custom lexicon for crypto-specific terms
sentiment.registerLanguage('en', {
  // Positive crypto terms
  'bullish': 2,
  'moon': 2,
  'hodl': 1,
  'adoption': 1,
  'decentralized': 1,
  'defi': 1,
  'staking': 1,
  'yield': 1,
  'gains': 2,
  'profitable': 2,
  
  // Negative crypto terms
  'bearish': -2,
  'dump': -2,
  'scam': -3,
  'hack': -3,
  'crash': -3,
  'rugpull': -3,
  'ponzi': -3,
  'fud': -2,
  'volatile': -1,
  'correction': -1
})

// Sentiment score ranges
export const SENTIMENT_RANGES = {
  VERY_NEGATIVE: [Number.NEGATIVE_INFINITY, -5],
  NEGATIVE: [-5, -1],
  NEUTRAL: [-1, 1],
  POSITIVE: [1, 5],
  VERY_POSITIVE: [5, Number.POSITIVE_INFINITY],
}

// Sentiment types
export type SentimentType = "very-negative" | "negative" | "neutral" | "positive" | "very-positive"

// Sentiment result interface
export interface SentimentResult {
  score: number
  comparative: number
  type: SentimentType
  tokens: string[]
  positive: string[]
  negative: string[]
}

// Analyze sentiment of a single text
export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  // Remove URLs, mentions, and hashtags for better analysis
  const cleanText = text
    .replace(/https?:\/\/\S+/g, "")
    .replace(/@\w+/g, "")
    .replace(/#\w+/g, "")
    .trim()

  // Get sentiment score
  const result = sentiment.analyze(cleanText)

  // Determine sentiment type based on score
  let type: SentimentType = "neutral"
  if (result.score <= SENTIMENT_RANGES.VERY_NEGATIVE[1]) {
    type = "very-negative"
  } else if (result.score <= SENTIMENT_RANGES.NEGATIVE[1]) {
    type = "negative"
  } else if (result.score <= SENTIMENT_RANGES.NEUTRAL[1]) {
    type = "neutral"
  } else if (result.score <= SENTIMENT_RANGES.POSITIVE[1]) {
    type = "positive"
  } else {
    type = "very-positive"
  }

  return {
    score: result.score,
    comparative: result.comparative,
    type,
    tokens: result.tokens,
    positive: result.positive,
    negative: result.negative,
  }
}

// Analyze sentiment of multiple tweets
export const analyzeTweetsSentiment = cache(async (tweets: TwitterTweet[]): Promise<(TwitterTweet & { sentiment: SentimentResult })[]> => {
  return await Promise.all(tweets.map(async (tweet) => {
    const sentiment = await analyzeSentiment(tweet.text)
    return { ...tweet, sentiment }
  }))
})

// Extract key terms from tweets with their sentiment
export async function extractKeyTerms(tweets: (TwitterTweet & { sentiment: SentimentResult })[]): Promise<Array<{
  text: string
  value: number
  sentiment: "positive" | "negative" | "neutral"
}>> {
  const termFrequency: Record<string, { count: number; score: number }> = {}
  
  tweets.forEach((tweet) => {
    if (!tweet.sentiment) return
    
    const { positive: positiveWords, negative: negativeWords } = tweet.sentiment
    
    // Count positive words
    positiveWords.forEach((word) => {
      if (word.length < 3) return // Skip very short words
      
      if (!termFrequency[word]) {
        termFrequency[word] = { count: 0, score: 0 }
      }
      termFrequency[word].count++
      termFrequency[word].score += 1
    })
    
    // Count negative words
    negativeWords.forEach((word) => {
      if (word.length < 3) return // Skip very short words
      
      if (!termFrequency[word]) {
        termFrequency[word] = { count: 0, score: 0 }
      }
      termFrequency[word].count++
      termFrequency[word].score -= 1
    })
  })
  
  // Convert to array and sort by frequency
  const terms = Object.entries(termFrequency)
    .map(([text, { count, score }]) => ({
      text,
      value: count,
      sentiment: score > 0 ? "positive" : score < 0 ? "negative" : "neutral" as "positive" | "negative" | "neutral"
    }))
    .sort((a, b) => b.value - a.value)
  
  return terms
}

// Calculate overall sentiment from tweets
export async function calculateOverallSentiment(tweets: (TwitterTweet & { sentiment: SentimentResult })[]): Promise<{
  averageScore: number
  type: SentimentType
  distribution: Record<SentimentType, number>
}> {
  if (!tweets.length) {
    return {
      averageScore: 0,
      type: "neutral",
      distribution: {
        "very-negative": 0,
        "negative": 0,
        "neutral": 0,
        "positive": 0,
        "very-positive": 0
      }
    }
  }
  
  // Count tweets by sentiment type
  const distribution: Record<SentimentType, number> = {
    "very-negative": 0,
    "negative": 0,
    "neutral": 0,
    "positive": 0,
    "very-positive": 0
  }
  
  // Calculate total score
  let totalScore = 0
  tweets.forEach((tweet) => {
    if (tweet.sentiment) {
      totalScore += tweet.sentiment.score
      distribution[tweet.sentiment.type]++
    }
  })
  
  // Calculate average score
  const averageScore = totalScore / tweets.length
  
  // Determine overall sentiment type
  let type: SentimentType = "neutral"
  if (averageScore <= SENTIMENT_RANGES.VERY_NEGATIVE[1]) {
    type = "very-negative"
  } else if (averageScore <= SENTIMENT_RANGES.NEGATIVE[1]) {
    type = "negative"
  } else if (averageScore <= SENTIMENT_RANGES.NEUTRAL[1]) {
    type = "neutral"
  } else if (averageScore <= SENTIMENT_RANGES.POSITIVE[1]) {
    type = "positive"
  } else {
    type = "very-positive"
  }
  
  return {
    averageScore,
    type,
    distribution,
  }
}

