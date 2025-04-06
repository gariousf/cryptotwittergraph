// Constants for sentiment analysis (no "use server" directive)

// Sentiment ranges for classification
export const SENTIMENT_RANGES = {
  VERY_NEGATIVE: [-Infinity, -5],
  NEGATIVE: [-5, -1],
  NEUTRAL: [-1, 1],
  POSITIVE: [1, 5],
  VERY_POSITIVE: [5, Infinity]
}

// Sentiment types
export type SentimentType = 'very-negative' | 'negative' | 'neutral' | 'positive' | 'very-positive' 