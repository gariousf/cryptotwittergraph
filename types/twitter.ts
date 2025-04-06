import type { SentimentResult } from "@/lib/sentiment-service"

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
  created_at: string
  author_id: string
  public_metrics?: {
    retweet_count: number
    reply_count: number
    like_count: number
    quote_count: number
  }
  referenced_tweets?: {
    type: "retweeted" | "quoted" | "replied_to"
    id: string
  }[]
  entities?: {
    mentions?: {
      start: number
      end: number
      username: string
      id: string
    }[]
  }
  sentiment?: SentimentResult
}

// Connection types
export type ConnectionType = "follows" | "mentioned" | "retweeted" | "replied" | "quoted"

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

