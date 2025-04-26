import type { TwitterTweet, TwitterUser } from "./twitter";
// Import NLP/Sentiment types
import type { FullSentimentAnalysisResult, EnhancedEntity } from "@/types/nlp";

export interface MonitoredAccount {
  id: string; // Twitter User ID
  username: string;
  name: string;
  addedAt: number; // Timestamp when added
  lastCheckedTweetId?: string; // ID of the most recent tweet processed
  lastCheckTimestamp?: number; // Timestamp of the last successful check
}

// Renamed slightly to reflect broader analysis, but kept `DetectedLaunch` for now
// to minimize breaking changes. Consider renaming to `AnalyzedTweet` later.
export interface DetectedLaunch {
  id: string; // Unique ID for the detected content (e.g., tweet ID)
  detectedAt: number; // Timestamp when detected by our system
  tweet: TwitterTweet;
  author: Pick<TwitterUser, 'id' | 'username' | 'name' | 'profile_image_url' | 'public_metrics'>; // Add public_metrics for author influence

  // Launch specific (keep for now)
  matchedKeywords: string[];
  potentialContract?: string;
  dexLink?: string;
  isPotentialLaunch: boolean; // Flag if it met launch criteria

  // Added Analysis Fields
  sentimentAnalysis?: FullSentimentAnalysisResult; // Store full sentiment results
  extractedEntities?: EnhancedEntity[]; // Store extracted entities (includes contracts)
  potentialImpactScore?: number; // Calculated heuristic score (0-1)
} 