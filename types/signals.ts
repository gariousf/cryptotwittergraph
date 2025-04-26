export type SignalType = 'BUY' | 'SELL' | 'WATCH_STRONG' | 'WATCH_WEAK' | 'NEUTRAL';
export type SignalSource = 'Sentiment Shift' | 'Topic Emergence' | 'Influencer Activity' | 'Price Correlation'; // Added Price Correlation as potential source

export interface TradingSignal {
  id: string; // Unique identifier for the signal
  timestamp: number; // When the signal was generated
  type: SignalType; // BUY, SELL, WATCH_STRONG, etc.
  source: SignalSource; // What triggered the signal (Sentiment, Topic, Influencer)
  strength: number; // Confidence level (e.g., 0 to 1)
  targetAsset?: string; // Optional: Specific crypto asset (e.g., 'BTC', 'ETH')
  topic?: string; // Optional: Related topic/hashtag
  influencer?: { // Optional: Related influencer
    username: string;
    name: string;
  };
  reason: string; // Brief explanation for the signal
  relatedData?: any; // Optional: Supporting data (e.g., sentiment score change, topic frequency)
}

export interface SignalGenerationConfig {
  sentimentThreshold?: number; // e.g., +/- 0.5 change required for a signal
  topicVelocityThreshold?: number; // e.g., minimum growth rate for topic emergence signal
  influencerScoreThreshold?: number; // e.g., minimum KOL score to monitor
  // Add other configuration parameters as needed
} 