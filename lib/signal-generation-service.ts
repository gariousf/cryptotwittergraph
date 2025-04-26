"use server"

import { cache } from "react"
import { v4 as uuidv4 } from 'uuid'; // Need to install uuid: npm install uuid @types/uuid
import type { TradingSignal, SignalType, SignalSource, SignalGenerationConfig } from "@/types/signals";
import type { SentimentAnalysisResult } from "./sentiment-service";
import type { EmergingTopic } from "./topic-detection-service";
import type { NodeAnalytics } from "./analytics-service";
import { getSentimentTimeline } from "./sentiment-service";
import { getEmergingTopics } from "./topic-detection-service";
import { calculateNetworkAnalytics } from "./analytics-service";
import { getWindowKeys, getWindow } from "./db-service";
import { findTopInfluencers } from "./analytics-service"; // Assuming this function exists or can be derived

// Default configuration (can be overridden)
const DEFAULT_CONFIG: SignalGenerationConfig = {
  sentimentThreshold: 0.3, // Significant sentiment change threshold
  topicVelocityThreshold: 1.5, // Topic frequency growth factor threshold
  influencerScoreThreshold: 70, // KOL score threshold
};

/**
 * Analyze sentiment shifts for potential signals.
 */
async function generateSentimentSignals(
  config: SignalGenerationConfig,
  currentTimeWindowKey: string | null,
  previousTimeWindowKey: string | null
): Promise<TradingSignal[]> {
  const signals: TradingSignal[] = [];
  if (!currentTimeWindowKey || !previousTimeWindowKey) return signals;

  try {
    // Fetch sentiment timelines (assuming getSentimentTimeline provides overall sentiment per window)
    // Note: This might need adjustment based on the actual structure of getSentimentTimeline
    // We might need a function like `getOverallSentimentForWindow(windowKey)`
    const currentSentimentData = await getSentimentTimeline(currentTimeWindowKey); // Placeholder - adapt based on actual service
    const previousSentimentData = await getSentimentTimeline(previousTimeWindowKey); // Placeholder - adapt based on actual service

    // Simplified example: Compare average sentiment between the last points of the timelines
    const currentAvg = currentSentimentData.timeline[currentSentimentData.timeline.length - 1]?.averageScore;
    const previousAvg = previousSentimentData.timeline[previousSentimentData.timeline.length - 1]?.averageScore;

    if (currentAvg !== undefined && previousAvg !== undefined && config.sentimentThreshold) {
      const change = currentAvg - previousAvg;
      const absChange = Math.abs(change);
      const strength = Math.min(absChange / (config.sentimentThreshold * 2), 1); // Normalize strength

      let type: SignalType = 'NEUTRAL';
      let reason = `Sentiment change (${change.toFixed(2)}) within threshold.`;

      if (change > config.sentimentThreshold) {
        type = strength > 0.7 ? 'BUY' : 'WATCH_STRONG';
        reason = `Significant positive sentiment shift detected (+${change.toFixed(2)}).`;
      } else if (change < -config.sentimentThreshold) {
        type = strength > 0.7 ? 'SELL' : 'WATCH_STRONG';
        reason = `Significant negative sentiment shift detected (${change.toFixed(2)}).`;
      } else if (absChange > config.sentimentThreshold / 2) {
         type = 'WATCH_WEAK';
         reason = `Moderate sentiment shift detected (${change.toFixed(2)}).`;
      }

      if (type !== 'NEUTRAL') {
        signals.push({
          id: uuidv4(),
          timestamp: Date.now(),
          type,
          source: 'Sentiment Shift',
          strength,
          reason,
          relatedData: { currentAvg, previousAvg, change },
        });
      }
    }
  } catch (error) {
    console.error("Error generating sentiment signals:", error);
  }

  return signals;
}

/**
 * Analyze emerging topics for potential signals.
 */
async function generateTopicSignals(
  config: SignalGenerationConfig,
  currentTimeWindowKey: string | null,
  previousTimeWindowKey: string | null
): Promise<TradingSignal[]> {
  const signals: TradingSignal[] = [];
   if (!currentTimeWindowKey) return signals; // Need at least the current window

  try {
    const emergingTopicsResult = await getEmergingTopics(currentTimeWindowKey, previousTimeWindowKey);

    for (const topic of emergingTopicsResult.emerging) {
       // Check for rapid growth (velocity)
       const growthRate = topic.currentFrequency / (topic.previousFrequency || 1); // Avoid division by zero
       if (config.topicVelocityThreshold && growthRate > config.topicVelocityThreshold) {
         const strength = Math.min((growthRate - config.topicVelocityThreshold) / config.topicVelocityThreshold, 1); // Normalize strength
         signals.push({
           id: uuidv4(),
           timestamp: Date.now(),
           // Bias towards WATCH_STRONG for new topics, needs more context for BUY/SELL
           type: strength > 0.5 ? 'WATCH_STRONG' : 'WATCH_WEAK',
           source: 'Topic Emergence',
           strength,
           topic: topic.topic,
           reason: `Topic "${topic.topic}" shows rapid emergence (Growth: ${growthRate.toFixed(2)}x).`,
           relatedData: { ...topic, growthRate },
         });
       }
    }
     // Potentially add signals for declining topics as well (SELL/WATCH)
     for (const topic of emergingTopicsResult.declining) {
        const declineRate = (topic.previousFrequency || 0) / (topic.currentFrequency || 1);
         if (config.topicVelocityThreshold && declineRate > config.topicVelocityThreshold) {
             const strength = Math.min((declineRate - config.topicVelocityThreshold) / config.topicVelocityThreshold, 1);
             signals.push({
                 id: uuidv4(),
                 timestamp: Date.now(),
                 type: strength > 0.5 ? 'WATCH_STRONG' : 'WATCH_WEAK', // Declining might suggest SELL, but needs context
                 source: 'Topic Emergence',
                 strength,
                 topic: topic.topic,
                 reason: `Topic "${topic.topic}" shows rapid decline (Decline: ${declineRate.toFixed(2)}x).`,
                 relatedData: { ...topic, declineRate },
             });
         }
     }

  } catch (error) {
    console.error("Error generating topic signals:", error);
  }
  return signals;
}

/**
 * Analyze influential user activity (Placeholder - Requires more complex implementation).
 * This would likely involve fetching recent tweets of KOLs and analyzing their content/sentiment.
 */
async function generateInfluencerSignals(
  config: SignalGenerationConfig,
  graphData: any // Assuming graph data is passed or fetched
): Promise<TradingSignal[]> {
  const signals: TradingSignal[] = [];
  if (!config.influencerScoreThreshold) return signals;

  try {
    // 1. Identify KOLs based on score or network centrality
    // Assuming findTopInfluencers exists and returns users with scores
    const topInfluencers = await findTopInfluencers(graphData, 10); // Get top 10 influencers

    // Filter by score threshold
    const kols = topInfluencers.filter(inf => (inf.kolScore || 0) >= config.influencerScoreThreshold);

    // 2. Fetch recent tweets for each KOL (Requires twitter-api enhancements & careful rate limit handling)
    // Example:
    // for (const kol of kols) {
    //   const recentTweets = await getUserTweets(kol.id, { max_results: 10 }); // Needs careful implementation
    //   // 3. Analyze tweets for asset mentions and strong sentiment
    //   for (const tweet of recentTweets) {
    //     const sentimentResult = analyzeSentiment(tweet.text); // Use sentiment service
    //     const mentionedAssets = extractAssets(tweet.text); // Needs utility function
    //
    //     if (mentionedAssets.length > 0 && Math.abs(sentimentResult.score) > SOME_SENTIMENT_THRESHOLD) {
    //       // Generate signal based on sentiment direction and KOL score
    //       signals.push({ ... });
    //     }
    //   }
    // }

    // Placeholder signal for demonstration
    if (kols.length > 0) {
        signals.push({
            id: uuidv4(),
            timestamp: Date.now(),
            type: 'WATCH_WEAK',
            source: 'Influencer Activity',
            strength: 0.3, // Placeholder strength
            influencer: { username: kols[0].username, name: kols[0].name },
            reason: `Monitoring activity from top influencer ${kols[0].username}. (Detailed analysis pending implementation)`,
            relatedData: { kolCount: kols.length }
        });
    }


  } catch (error) {
    console.error("Error generating influencer signals:", error);
  }
  return signals;
}


/**
 * Generate trading signals based on various data points.
 */
export const generateTradingSignals = cache(async (
  graphData: any, // Pass graph data needed for influencer analysis
  config: SignalGenerationConfig = DEFAULT_CONFIG
): Promise<TradingSignal[]> => {
  console.log("Generating trading signals with config:", config);
  let allSignals: TradingSignal[] = [];

  try {
    const windowKeys = await getWindowKeys();
    const currentTimeWindowKey = windowKeys.length > 0 ? windowKeys[windowKeys.length - 1] : null;
    const previousTimeWindowKey = windowKeys.length > 1 ? windowKeys[windowKeys.length - 2] : null;

    console.log(`Using time windows: Current=${currentTimeWindowKey}, Previous=${previousTimeWindowKey}`);

    // Generate signals from different sources
    const sentimentSignals = await generateSentimentSignals(config, currentTimeWindowKey, previousTimeWindowKey);
    const topicSignals = await generateTopicSignals(config, currentTimeWindowKey, previousTimeWindowKey);
    // Influencer signals require graph data, fetch or pass it in
    const influencerSignals = await generateInfluencerSignals(config, graphData);
    // TODO: Add Price Correlation Signals

    allSignals = [...sentimentSignals, ...topicSignals, ...influencerSignals];

    // Sort signals (e.g., by strength or timestamp)
    allSignals.sort((a, b) => b.strength - a.strength || b.timestamp - a.timestamp);

    console.log(`Generated ${allSignals.length} signals.`);

  } catch (error) {
    console.error("Failed to generate trading signals:", error);
    // Return an empty array or a specific error signal
     allSignals.push({
       id: uuidv4(),
       timestamp: Date.now(),
       type: 'NEUTRAL',
       source: 'System Error',
       strength: 0,
       reason: `Error during signal generation: ${error instanceof Error ? error.message : 'Unknown error'}`,
     });
  }

  return allSignals;
});

// Helper function placeholder - needs implementation
// function extractAssets(text: string): string[] {
//   // Logic to find crypto symbols like $BTC, #Bitcoin, ETH, etc.
//   return [];
// } 