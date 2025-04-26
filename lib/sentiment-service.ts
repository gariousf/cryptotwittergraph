"use server"

import Sentiment from "sentiment"
import type { TwitterTweet } from "@/types/twitter"
import { cache } from "react"
import { SENTIMENT_RANGES, type SentimentType } from "./sentiment-constants"
// Import new NLP types
import type { DetectedEmotion, AspectSentiment, CryptoEmotion, CryptoAspect, EnhancedEntity } from "@/types/nlp"

// Initialize sentiment analyzer
const sentiment = new Sentiment()

// Add custom lexicon for crypto-specific terms
// The correct format for registerLanguage is { labels: { term: value } }
sentiment.registerLanguage('en', {
  labels: {
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
    'bubble': -2,
    'correction': -1
  }
})

// Define the primary result structure, incorporating basic and advanced analysis
export interface FullSentimentAnalysisResult {
  // Basic Sentiment
  score: number; // Overall sentiment score (-inf, +inf)
  comparative: number; // Comparative score per word
  type: SentimentType; // Classified type (very-negative, etc.)
  positiveWords: string[];
  negativeWords: string[];

  // Fine-grained Emotions
  emotions?: DetectedEmotion[];

  // Aspect-Based Sentiment
  aspects?: AspectSentiment[];

  // Potentially add dominant emotion/aspect here if calculated
  dominantEmotion?: CryptoEmotion;
  keyAspect?: CryptoAspect;
}

// Update the existing SentimentResult type if needed, or keep it separate
// For simplicity, let's keep the existing SentimentResult for basic use cases
// and use FullSentimentAnalysisResult where advanced details are needed.
export type SentimentResult = {
  score: number;
  comparative: number;
  type: SentimentType;
  positive: string[];
  negative: string[];
}

const NLP_API_URL = process.env.NLP_MICROSERVICE_URL; // Get URL from env

// Analyze sentiment of a single text
export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  // Remove URLs, mentions, and hashtags for better analysis
  const cleanText = text
    .replace(/https?:\/\/\S+/g, '')
    .replace(/@\w+/g, '')
    .replace(/#\w+/g, '')
    .trim()
  
  // Analyze sentiment
  const result = sentiment.analyze(cleanText)
  
  // Determine sentiment type
  let type: SentimentType = 'neutral'
  if (result.score <= SENTIMENT_RANGES.VERY_NEGATIVE[1]) {
    type = 'very-negative'
  } else if (result.score <= SENTIMENT_RANGES.NEGATIVE[1]) {
    type = 'negative'
  } else if (result.score <= SENTIMENT_RANGES.NEUTRAL[1]) {
    type = 'neutral'
  } else if (result.score <= SENTIMENT_RANGES.POSITIVE[1]) {
    type = 'positive'
  } else {
    type = 'very-positive'
  }
  
  return {
    score: result.score,
    comparative: result.comparative,
    type,
    positive: result.positive,
    negative: result.negative
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
  
  tweets.forEach(tweet => {
    if (!tweet.sentiment) return
    
    const { positive: positiveWords, negative: negativeWords } = tweet.sentiment
    
    // Count positive words
    positiveWords.forEach(word => {
      if (!termFrequency[word]) {
        termFrequency[word] = { count: 0, score: 0 }
      }
      termFrequency[word].count++
      termFrequency[word].score++
    })
    
    // Count negative words
    negativeWords.forEach(word => {
      if (!termFrequency[word]) {
        termFrequency[word] = { count: 0, score: 0 }
      }
      termFrequency[word].count++
      termFrequency[word].score--
    })
  })
  
  // Convert to array and sort by frequency
  return Object.entries(termFrequency)
    .filter(([_, { count }]) => count >= 2) // Filter out rare terms
    .map(([text, { count, score }]) => {
      // Determine sentiment
      let sentiment: "positive" | "negative" | "neutral" = "neutral"
      if (score > 0) {
        sentiment = "positive"
      } else if (score < 0) {
        sentiment = "negative"
      }
      
      return {
        text,
        value: count,
        sentiment
      }
    })
    .sort((a, b) => b.value - a.value)
}

// Calculate overall sentiment for a set of tweets
export async function calculateOverallSentiment(tweets: (TwitterTweet & { sentiment: SentimentResult })[]): Promise<{
  averageScore: number
  type: SentimentType
  distribution: Record<SentimentType, number>
}> {
  if (tweets.length === 0) {
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
  
  // Initialize distribution
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

// Placeholder function - Ensure it exists and is exported
// If this function was removed/renamed, update the imports in signal-generation-service.ts
export async function getSentimentTimeline(windowKey: string): Promise<any> { // Replace 'any' with actual return type
    console.log(`Placeholder: Fetching sentiment timeline for window: ${windowKey}`);
    // Dummy data structure - adapt based on actual needs/implementation
    return {
        timeline: [
            { timestamp: windowKey, averageScore: Math.random() * 2 - 1, type: 'neutral' }
        ]
    };
}

/**
 * Performs full sentiment analysis by calling the NLP microservice.
 */
export const performFullSentimentAnalysis = cache(async (text: string): Promise<FullSentimentAnalysisResult> => {
    console.log(`Requesting full analysis for text: "${text.substring(0, 50)}..."`);
    const result = await callNlpService<{
        sentiment: SentimentResult; // Assuming service returns basic sentiment too
        emotions: DetectedEmotion[];
        aspects: AspectSentiment[];
        // Assuming entities are also returned by this endpoint for efficiency
        entities?: EnhancedEntity[];
    }>('/analyze_text', { text });

    if (!result) {
        console.warn("NLP service call failed or returned null. Falling back to basic local sentiment.");
        // Fallback to basic sentiment analysis only
        const basicResult = await analyzeSentiment(text); // Keep your local basic one as fallback
        return {
            ...basicResult,
            positiveWords: basicResult.positive,
            negativeWords: basicResult.negative,
            emotions: [],
            aspects: [],
        };
    }

     // Find dominant emotion (highest score) - Moved logic here from placeholder
     const dominantEmotion = result.emotions?.length > 0
     ? result.emotions.reduce((max, e) => e.score > max.score ? e : max, result.emotions[0]).emotion
     : undefined;

      // Find key aspect - Moved logic here from placeholder
      const keyAspect = result.aspects?.length > 0
          ? result.aspects.find(a => a.sentiment.type !== 'neutral')?.aspect || result.aspects[0].aspect
          : undefined;


    // Combine results (assuming the API returns components separately)
    return {
        // Use sentiment details from the service if provided, else fallback needed
        score: result.sentiment?.score ?? 0,
        comparative: result.sentiment?.comparative ?? 0,
        type: result.sentiment?.type ?? 'neutral',
        positiveWords: result.sentiment?.positive ?? [],
        negativeWords: result.sentiment?.negative ?? [],
        emotions: result.emotions ?? [],
        aspects: result.aspects ?? [],
        dominantEmotion: dominantEmotion,
        keyAspect: keyAspect,
        // Note: We might need to adjust the expected response structure from /analyze_text
    };
});

async function callNlpService<T>(endpoint: string, body: any): Promise<T | null> {
    if (!NLP_API_URL) {
        console.error("NLP_MICROSERVICE_URL environment variable is not set.");
        // Return a default/error state appropriate for the expected type T
        // This is tricky without knowing T, throwing might be better in some cases.
        // For now, return null and let callers handle it.
        return null;
    }

    try {
        console.log(`Calling NLP service: ${NLP_API_URL}${endpoint}`);
        const response = await fetch(`${NLP_API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Add any necessary auth headers if your service requires them
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`NLP service error (${response.status}): ${errorBody}`);
            // Depending on the expected type T, return a default or null
            return null;
        }

        const data = await response.json();
        console.log(`NLP service response for ${endpoint}:`, data); // Log the raw response
        return data as T;
    } catch (error) {
        console.error(`Failed to fetch from NLP service (${endpoint}):`, error);
         // Depending on the expected type T, return a default or null
        return null;
    }
}

