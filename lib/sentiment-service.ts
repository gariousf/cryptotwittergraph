import Sentiment from "sentiment"
import type { TwitterTweet } from "@/types/twitter"

// Initialize sentiment analyzer
const sentiment = new Sentiment()

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
export function analyzeSentiment(text: string): SentimentResult {
  // Remove URLs, mentions, and hashtags for better analysis
  const cleanText = text
    .replace(/https?:\/\/\S+/g, "")
    .replace(/@\w+/g, "")
    .replace(/#\w+/g, "")
    .trim()

  // Get sentiment score
  const result = sentiment.analyze(cleanText)

  // Determine sentiment type
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
export function analyzeTweetsSentiment(tweets: TwitterTweet[]): {
  tweets: (TwitterTweet & { sentiment: SentimentResult })[]
  averageScore: number
  sentimentDistribution: Record<SentimentType, number>
} {
  // Initialize sentiment distribution
  const sentimentDistribution: Record<SentimentType, number> = {
    "very-negative": 0,
    negative: 0,
    neutral: 0,
    positive: 0,
    "very-positive": 0,
  }

  // Analyze each tweet
  const analyzedTweets = tweets.map((tweet) => {
    const sentiment = analyzeSentiment(tweet.text)
    sentimentDistribution[sentiment.type]++
    return { ...tweet, sentiment }
  })

  // Calculate average sentiment score
  const totalScore = analyzedTweets.reduce((sum, tweet) => sum + tweet.sentiment.score, 0)
  const averageScore = tweets.length > 0 ? totalScore / tweets.length : 0

  return {
    tweets: analyzedTweets,
    averageScore,
    sentimentDistribution,
  }
}

// Get sentiment color based on type
export function getSentimentColor(type: SentimentType): string {
  switch (type) {
    case "very-negative":
      return "#ef4444" // red-500
    case "negative":
      return "#f97316" // orange-500
    case "neutral":
      return "#6b7280" // gray-500
    case "positive":
      return "#10b981" // emerald-500
    case "very-positive":
      return "#22c55e" // green-500
    default:
      return "#6b7280" // gray-500
  }
}

// Get sentiment emoji based on type
export function getSentimentEmoji(type: SentimentType): string {
  switch (type) {
    case "very-negative":
      return "😡"
    case "negative":
      return "😟"
    case "neutral":
      return "😐"
    case "positive":
      return "🙂"
    case "very-positive":
      return "😄"
    default:
      return "😐"
  }
}

