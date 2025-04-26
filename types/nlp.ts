// Define common crypto emotions
export type CryptoEmotion = 'Fear' | 'Greed' | 'FOMO' | 'FUD' | 'Excitement' | 'Hope' | 'Skepticism' | 'Neutral';

// Define common crypto aspects
export type CryptoAspect = 'Tokenomics' | 'Technology' | 'Team' | 'Roadmap' | 'Community' | 'Security' | 'Partnership' | 'Price Action' | 'Regulation' | 'General';

// Define enhanced entity types
export type CryptoEntityType = 'TOKEN_SYMBOL' | 'PROJECT_NAME' | 'PROTOCOL' | 'EXCHANGE' | 'PERSON' | 'DEFI_CONCEPT' | 'NFT_PROJECT' | 'EVENT' | 'OTHER';

export interface DetectedEmotion {
  emotion: CryptoEmotion;
  score: number; // Confidence score (0-1)
}

export interface AspectSentiment {
  aspect: CryptoAspect;
  sentiment: SentimentResult; // Reuse existing sentiment type
  textSpan: string; // The part of the text related to this aspect
}

export interface EnhancedEntity {
  text: string;
  type: CryptoEntityType;
  start: number;
  end: number;
  normalizedText?: string; // e.g., map '$SOL' and 'Solana' to 'SOLANA'
  sentiment?: SentimentResult; // Optional: Sentiment towards this entity
}

export interface DiscussionSummary {
  keyPoints: string[];
  overallSentiment: SentimentResult;
  dominantEmotion?: CryptoEmotion;
  influentialTweets: string[]; // IDs of key tweets
  keyEntities: EnhancedEntity[];
} 