import type { SentimentResult } from "@/lib/sentiment-service"
// Import new NLP types
import type { DetectedEmotion, AspectSentiment, EnhancedEntity } from "./nlp"

export interface TwitterUser {
  id: string
  name: string
  username: string
  description?: string
  profile_image_url?: string
  public_metrics?: {
    followers_count: number
    following_count: number
    tweet_count: number
    listed_count: number
  }
}

export interface TwitterFollowing {
  data: TwitterUser[]
  meta: {
    result_count: number
    next_token?: string
  }
}

export interface TwitterResponse<T> {
  data: T
  includes?: any
  meta?: {
    result_count: number
    next_token?: string
  }
}

// Add public_metrics to TwitterTweet
export interface TwitterTweet {
  id: string
  text: string
  created_at?: string
  author_id?: string
  public_metrics?: {
    retweet_count: number
    reply_count: number
    like_count: number
    quote_count: number
  }
  entities?: {
    mentions?: Array<{
      start: number
      end: number
      username: string
      id: string
    }>
    hashtags?: Array<{
      start: number
      end: number
      tag: string
    }>
    urls?: Array<{
      start: number
      end: number
      url: string
      expanded_url: string
      display_url: string
    }>
    // Add enhanced entities
    enhanced_entities?: EnhancedEntity[];
  }
  referenced_tweets?: Array<{
    type: "replied_to" | "retweeted" | "quoted"
    id: string
  }>
  sentiment?: SentimentResult
  // Add advanced NLP results
  emotions?: DetectedEmotion[];
  aspect_sentiments?: AspectSentiment[];
}

// Connection types
export type ConnectionType = "follows" | "mentioned" | "retweeted" | "quoted" | "replied"

// Graph data types
// Add sentiment data to GraphNode
export interface GraphNode {
  id: string
  name: string
  username: string
  group: string
  followers: number
  imageUrl?: string
  description?: string
  kolRank?: number
  sentiment?: {
    averageScore: number
    type: string
    distribution: Record<string, number>
  }
  // Optional aggregated emotions/aspects over user's tweets
  aggregatedEmotions?: Record<CryptoEmotion, number>;
  aggregatedAspects?: Record<CryptoAspect, { score: number; count: number }>;
}

export interface GraphLink {
  source: string
  target: string
  value: number
  type: ConnectionType
  timestamp?: string // For sorting by recency
  count?: number // For aggregating multiple interactions
}

export interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

