"use server"

import { getUserTweets, getUserByUsername } from "./twitter-api"; // Assuming these exist
import {
    saveMonitoredAccount,
    getMonitoredAccounts,
    getLastCheckedTweetId,
    updateLastCheckedTweetId,
    saveDetectedLaunch,
    getMonitoredAccount // Need this to get follower count
} from "./db-service";
import { performFullSentimentAnalysis } from './sentiment-service';
// Assuming extractCryptoEntities exists and works via NLP service or locally
// If not, integrate the regex logic directly here or call the appropriate service
// import { extractCryptoEntities } from './topic-detection-service'; // Or directly use regex here

import type { TwitterTweet, TwitterUser } from "@/types/twitter";
import type { MonitoredAccount, DetectedLaunch } from "@/types/launch-detector";
import type { FullSentimentAnalysisResult, EnhancedEntity, CryptoEntityType } from "@/types/nlp"; // Import necessary types
import { cache } from "react";

// --- Configuration ---
const DEFAULT_POLLING_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_TWEETS_PER_FETCH = 20; // Fetch fewer tweets more often

// --- Detection/Analysis Logic ---

// Refined Regex (keep these)
const CONTRACT_REGEX = /0x[a-fA-F0-9]{40}/ig; // Add 'g' flag for multiple matches
const SOLANA_CONTRACT_REGEX = /[1-9A-HJ-NP-Za-km-z]{32,44}/g; // Add 'g' flag
const LAUNCH_KEYWORDS = [
    "launching soon", "launching now", "live on", "token launch", "is live",
    "contract address", "presale live", "public sale", "token sale",
    "fair launch", "stealth launch", "pump.fun" // Added pump.fun common term
];
const DEX_LINKS = ["raydium.io", "dexscreener.com", "birdeye.so", "pump.fun", "uniswap.org", "pancakeswap.finance", "jupiter.exchange", "jup.ag"];

// Helper to extract entities (simplified - replace with NLP call if possible)
function extractEntitiesSimple(text: string): EnhancedEntity[] {
     const entities: EnhancedEntity[] = [];
     const ethContracts = [...text.matchAll(CONTRACT_REGEX)];
     const solContracts = [...text.matchAll(SOLANA_CONTRACT_REGEX)];

     ethContracts.forEach(match => {
         if (match.index !== undefined) {
             entities.push({ text: match[0], type: 'TOKEN_SYMBOL', start: match.index, end: match.index + match[0].length });
         }
     });
      solContracts.forEach(match => {
         if (match.index !== undefined) {
             entities.push({ text: match[0], type: 'TOKEN_SYMBOL', start: match.index, end: match.index + match[0].length });
         }
     });
      // Add other simple entity extractions if needed (e.g., $tickers)
     return entities;
}


/**
 * Calculates a heuristic score indicating the potential impact or interest level of a tweet.
 * Score ranges from 0 to 1.
 */
function calculatePotentialImpactScore(
    tweet: TwitterTweet,
    analysis: FullSentimentAnalysisResult | undefined,
    entities: EnhancedEntity[] | undefined,
    authorFollowers: number | undefined
): number {
    let score = 0;
    const maxScore = 10; // Arbitrary scale factor

    // 1. Sentiment Strength (max 3 points)
    if (analysis?.score) {
        // Use absolute score, higher magnitude = more impact (positive or negative)
        score += Math.min(3, Math.abs(analysis.score) * 0.5);
    }

    // 2. Author Influence (max 3 points) - Log scale for followers
    if (authorFollowers && authorFollowers > 0) {
        score += Math.min(3, Math.log10(authorFollowers + 1) * 0.5); // Add 1 to avoid log10(0)
    }

    // 3. Presence of Contract/Token Symbols (max 2 points)
    const hasContract = entities?.some(e => e.type === 'TOKEN_SYMBOL'); // Check extracted entities
    if (hasContract) {
        score += 2;
    }

    // 4. Specific Emotions (max 1 point) - e.g., Excitement/FOMO
    const excitingEmotions = ['Excitement', 'FOMO', 'Greed'];
    if (analysis?.emotions?.some(e => excitingEmotions.includes(e.emotion) && e.score > 0.5)) {
        score += 1;
    }

     // 5. Engagement Metrics (Optional - max 1 point)
     const engagement = (tweet.public_metrics?.like_count || 0) + (tweet.public_metrics?.retweet_count || 0) * 2; // Weight retweets higher
     if (engagement > 0) {
         score += Math.min(1, Math.log10(engagement + 1) * 0.2);
     }


    // Normalize score to 0-1 range
    return Math.min(1, score / maxScore);
}


/**
 * Analyzes tweet content for launch keywords, addresses, sentiment, and impact.
 */
async function analyzeTweetContent(
    tweet: TwitterTweet,
    authorFollowers: number | undefined // Pass author's follower count
): Promise<Omit<DetectedLaunch, 'id' | 'detectedAt' | 'author'> | null> {
    const textLower = tweet.text.toLowerCase();
    const matchedKeywords = LAUNCH_KEYWORDS.filter(keyword => textLower.includes(keyword));

    // --- Perform Full Analysis ---
    const sentimentAnalysis = await performFullSentimentAnalysis(tweet.text);
    // Replace with call to NLP service if `extractCryptoEntities` is implemented there
    const extractedEntities = extractEntitiesSimple(tweet.text); // Use simplified version for now

    // Check for DEX links in URLs
    let hasDexLink = false;
    let dexLinkUrl: string | undefined;
     if (tweet.entities?.urls) {
         for (const url of tweet.entities.urls) {
             try {
                 const expandedUrl = url.expanded_url?.toLowerCase(); // Handle potential undefined
                 if (expandedUrl && DEX_LINKS.some(dex => expandedUrl.includes(dex))) {
                     hasDexLink = true;
                     dexLinkUrl = url.expanded_url;
                     break;
                 }
             } catch (urlError) {
                 console.warn(`Could not process URL ${url.url} in tweet ${tweet.id}: ${urlError}`);
             }
         }
     }

    // Check for contracts within extracted entities
    const potentialContract = extractedEntities?.find(e => e.type === 'TOKEN_SYMBOL')?.text; // Get first token symbol found

    // Determine if it meets basic launch criteria
    const isPotentialLaunch = matchedKeywords.length > 0 && (!!potentialContract || hasDexLink);

    // Calculate impact score
    const potentialImpactScore = calculatePotentialImpactScore(
        tweet,
        sentimentAnalysis,
        extractedEntities,
        authorFollowers
    );

    // --- Decide if this tweet is worth saving ---
    // Save if it's a potential launch OR has a high impact score (e.g., > 0.5)
    // Adjust threshold as needed
    if (isPotentialLaunch || (potentialImpactScore && potentialImpactScore > 0.4)) {
        console.log(`Tweet ${tweet.id} flagged. Launch=${isPotentialLaunch}, Impact=${potentialImpactScore?.toFixed(2)}`);
        return {
            tweet: tweet, // Include full tweet data
            matchedKeywords: matchedKeywords,
            potentialContract: potentialContract,
            dexLink: dexLinkUrl,
            isPotentialLaunch: isPotentialLaunch, // Store flag
            sentimentAnalysis: sentimentAnalysis, // Store sentiment
            extractedEntities: extractedEntities, // Store entities
            potentialImpactScore: potentialImpactScore // Store score
        };
    }

    return null; // Not deemed significant enough to save
}

// --- Polling Function ---

/**
 * Fetches and processes recent tweets (including replies) for a single monitored account.
 */
async function pollAccountForLaunches(account: MonitoredAccount): Promise<void> {
    console.log(`Polling account: @${account.username} (ID: ${account.id})`);
    try {
        // Fetch author details once to get follower count
        // Cache this per run or use the stored account data if it includes metrics
        const authorDetails = await getMonitoredAccount(account.id); // Reuse DB call if efficient
        const authorFollowers = authorDetails?.id === account.id // Basic check
            ? (await getUserByUsername(account.username))?.data?.public_metrics?.followers_count // Fetch live followers? Expensive! Use stored if possible.
            : undefined; // Fallback if details can't be fetched

        const lastCheckedId = await getLastCheckedTweetId(account.id);
        const options: Record<string, string> = {
             max_results: String(MAX_TWEETS_PER_FETCH),
             // ** CHANGE: Remove 'replies' exclusion to get user's replies **
             exclude: "retweets", // Only exclude retweets
             "tweet.fields": "created_at,public_metrics,entities,author_id", // Ensure needed fields
             // Add expansions if you need full author objects for replies (more complex)
             // "expansions": "author_id",
             // "user.fields": "public_metrics,profile_image_url" // Example user fields
        };
        if (lastCheckedId) {
            options.since_id = lastCheckedId;
            console.log(`Fetching tweets since ID: ${lastCheckedId}`);
        } else {
             console.log("No last checked ID found, fetching recent tweets.");
        }

        const tweetsResponse = await getUserTweets(account.id, options);

        if (!tweetsResponse || tweetsResponse.data?.length === 0) {
            console.log(`No new content found for @${account.username}.`);
            await updateLastCheckedTweetId(account.id, lastCheckedId || "");
            return;
        }

        const tweets = tweetsResponse.data;
        let latestTweetId = lastCheckedId || "0";

        console.log(`Processing ${tweets.length} new items (tweets/replies) for @${account.username}.`);

        for (const tweet of tweets) {
            if (tweet.id > latestTweetId) {
                 latestTweetId = tweet.id;
            }

            // Analyze the tweet/reply content
            const analysisResult = await analyzeTweetContent(tweet, authorFollowers);

            if (analysisResult) {
                const detectedContent: DetectedLaunch = {
                    ...analysisResult, // Contains tweet, keywords, analysis, score, etc.
                    id: tweet.id,
                    detectedAt: Date.now(),
                    author: { // Use monitored account details as primary author info
                        id: account.id,
                        username: account.username,
                        name: account.name,
                        profile_image_url: authorDetails?.id === account.id ? (await getUserByUsername(account.username))?.data?.profile_image_url : undefined, // Example fetching image URL
                        public_metrics: authorDetails?.id === account.id ? (await getUserByUsername(account.username))?.data?.public_metrics : undefined, // Fetch live metrics
                    }
                };
                await saveDetectedLaunch(detectedContent);
                console.log(`Saved analyzed content: ${tweet.id} from @${account.username}`);
                // TODO: Implement real-time notification
            }
        }

        if (latestTweetId !== lastCheckedId) {
             console.log(`Updating last checked ID for @${account.username} to ${latestTweetId}`);
            await updateLastCheckedTweetId(account.id, latestTweetId);
        } else {
             await updateLastCheckedTweetId(account.id, lastCheckedId || "");
        }

    } catch (error: any) {
         if (error?.status === 429 || error?.message?.includes('rate limit')) { // Check status and message text
             console.warn(`Rate limit potentially hit for account @${account.username}. Skipping this poll cycle.`);
         } else {
            console.error(`Error polling account @${account.username}:`, error);
         }
    }
}


// --- Service Control (Simplified for Demo) ---

let monitoringIntervalId: NodeJS.Timeout | null = null;

/**
 * Starts the background polling service.
 * IMPORTANT: In a real Next.js app (especially serverless), `setInterval` is unreliable
 * for long-running background tasks. Use external cron jobs (Vercel Cron),
 * background worker services, or queueing systems instead.
 */
export async function startLaunchMonitoringService(intervalMs: number = DEFAULT_POLLING_INTERVAL_MS): Promise<void> {
    if (monitoringIntervalId) {
        console.log("Launch monitoring service already running.");
        return;
    }

    console.log(`Starting launch monitoring service with interval: ${intervalMs / 1000} seconds.`);
    // **WARNING:** This interval applies to the *entire loop* of checking *all* accounts.
    // Checking each account every ~3 seconds requires intervalMs to be very low AND
    // distributing checks within the loop, which *will* hit rate limits fast.
    if (intervalMs < 5000) {
        console.warn("Extremely low polling interval requested (< 5s). This will likely hit Twitter API rate limits very quickly!");
    }

    monitoringIntervalId = setInterval(async () => {
        console.log("Running launch detection poll cycle...");
        const accounts = await getMonitoredAccounts();
        if (accounts.length === 0) {
            console.log("No accounts to monitor.");
            return;
        }
        console.log(`Polling ${accounts.length} accounts.`);
        // Sequentially poll to slightly mitigate burst rate limits
        // For true parallelism with rate limit handling, need a more complex queue/worker setup
        for (const account of accounts) {
            await pollAccountForLaunches(account);
             // Add a small delay between account checks if needed, further increasing cycle time
             // await new Promise(resolve => setTimeout(resolve, 500));
        }
         console.log("Launch detection poll cycle finished.");
    }, intervalMs); // The interval for checking ALL accounts
}

/**
 * Stops the background polling service.
 */
export async function stopLaunchMonitoringService(): Promise<void> {
    if (monitoringIntervalId) {
        console.log("Stopping launch monitoring service.");
        clearInterval(monitoringIntervalId);
        monitoringIntervalId = null;
    } else {
        console.log("Launch monitoring service is not running.");
    }
}

/**
 * Service function to add an account to monitor.
 */
export async function addAccountToMonitor(username: string): Promise<{ success: boolean; message: string; account?: MonitoredAccount }> {
    try {
        const user = await getUserByUsername(username); // Fetch user details by username

        if (!user) {
            console.error(`getUserByUsername returned null/undefined for ${username}, possibly due to API error.`);
            return { success: false, message: `Failed to fetch details for @${username}. API might be unavailable or rate limited.` };
        }
        if (!user.data) {
            return { success: false, message: `User @${username} not found.` };
        }

        const account: MonitoredAccount = {
            id: user.data.id,
            username: user.data.username,
            name: user.data.name,
            addedAt: Date.now(),
            // lastCheckedTweetId will be set on first poll
        };
        await saveMonitoredAccount(account);
        console.log(`Account @${username} added to monitoring.`);
        return { success: true, message: `Account @${username} added successfully.`, account };
    } catch (error: any) {
        console.error(`Error adding account @${username}:`, error);
        const message = error.message?.includes('429')
            ? `Failed to add account: Rate limit hit. Please wait and try again.`
            : `Failed to add account: ${error.message}`;
        return { success: false, message: message };
    }
}

/**
 * Service function to remove an account from monitoring.
 */
export async function removeAccountFromMonitor(userId: string): Promise<{ success: boolean; message: string }> {
     try {
         await removeMonitoredAccount(userId);
         console.log(`Account ID ${userId} removed from monitoring.`);
         return { success: true, message: "Account removed successfully." };
     } catch (error: any) {
         console.error(`Error removing account ID ${userId}:`, error);
         return { success: false, message: `Failed to remove account: ${error.message}` };
     }
} 