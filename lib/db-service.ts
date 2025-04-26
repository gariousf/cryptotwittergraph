"use server"

import { cache } from "react"
import type { AssociationRule } from "./association-rule-mining"
import type { HighUtilityPattern } from "./high-utility-pattern-mining"
import type { RuleChange } from "./transaction-rule-change-mining"
import type { TwitterTweet } from "@/types/twitter"
// Import new types
import type { MonitoredAccount, DetectedLaunch } from "@/types/launch-detector"

// In-memory database for simplicity
// In a real application, you would use a proper database
const db = {
  patterns: new Map<string, HighUtilityPattern[]>(),
  rules: new Map<string, AssociationRule[]>(),
  changes: new Map<string, RuleChange[]>(),
  windows: new Map<string, TwitterTweet[]>(),
  // Add storage for launch detector
  monitoredAccounts: new Map<string, MonitoredAccount>(), // Key: Twitter User ID
  detectedLaunches: new Map<string, DetectedLaunch>(),   // Key: Tweet ID
  lastCheckedTweetIds: new Map<string, string>(),      // Key: Twitter User ID, Value: Last Tweet ID checked
}

/**
 * Save patterns to database
 */
export async function savePatterns(
  windowKey: string,
  patterns: HighUtilityPattern[]
): Promise<void> {
  db.patterns.set(windowKey, patterns)
}

/**
 * Get patterns from database
 */
export const getPatterns = cache(async (
  windowKey: string
): Promise<HighUtilityPattern[]> => {
  return db.patterns.get(windowKey) || []
})

/**
 * Save rules to database
 */
export async function saveRules(
  windowKey: string,
  rules: AssociationRule[]
): Promise<void> {
  db.rules.set(windowKey, rules)
}

/**
 * Get rules from database
 */
export const getRules = cache(async (
  windowKey: string
): Promise<AssociationRule[]> => {
  return db.rules.get(windowKey) || []
})

/**
 * Save rule changes to database
 */
export async function saveRuleChanges(
  windowKey: string,
  changes: RuleChange[]
): Promise<void> {
  db.changes.set(windowKey, changes)
}

/**
 * Get rule changes from database
 */
export const getRuleChanges = cache(async (
  windowKey: string
): Promise<RuleChange[]> => {
  return db.changes.get(windowKey) || []
})

/**
 * Save window to database
 */
export async function saveWindow(
  windowKey: string,
  tweets: TwitterTweet[]
): Promise<void> {
  db.windows.set(windowKey, tweets)
}

/**
 * Get window from database
 */
export const getWindow = cache(async (
  windowKey: string
): Promise<TwitterTweet[]> => {
  return db.windows.get(windowKey) || []
})

/**
 * Get all window keys
 */
export const getWindowKeys = cache(async (): Promise<string[]> => {
  return Array.from(db.windows.keys()).sort()
})

// --- Functions for Launch Detector ---

/**
 * Add or update a monitored account.
 */
export async function saveMonitoredAccount(account: MonitoredAccount): Promise<void> {
  db.monitoredAccounts.set(account.id, account);
  // Also update the last checked ID if provided in the account object
  if (account.lastCheckedTweetId) {
      db.lastCheckedTweetIds.set(account.id, account.lastCheckedTweetId);
  }
}

/**
 * Remove a monitored account.
 */
export async function removeMonitoredAccount(userId: string): Promise<void> {
  db.monitoredAccounts.delete(userId);
  db.lastCheckedTweetIds.delete(userId); // Also remove last checked ID
}

/**
 * Get all monitored accounts.
 */
export const getMonitoredAccounts = cache(async (): Promise<MonitoredAccount[]> => {
  return Array.from(db.monitoredAccounts.values());
});

/**
 * Get a specific monitored account.
 */
export const getMonitoredAccount = cache(async (userId: string): Promise<MonitoredAccount | undefined> => {
    return db.monitoredAccounts.get(userId);
});


/**
 * Get the last checked tweet ID for an account.
 */
export const getLastCheckedTweetId = cache(async (userId: string): Promise<string | undefined> => {
  return db.lastCheckedTweetIds.get(userId);
});

/**
 * Update the last checked tweet ID for an account.
 */
export async function updateLastCheckedTweetId(userId: string, tweetId: string): Promise<void> {
    db.lastCheckedTweetIds.set(userId, tweetId);
    // Optionally update timestamp on the main account object too
    const account = db.monitoredAccounts.get(userId);
    if(account) {
        account.lastCheckedTweetId = tweetId;
        account.lastCheckTimestamp = Date.now();
    }
}

/**
 * Save a detected launch tweet.
 */
export async function saveDetectedLaunch(launch: DetectedLaunch): Promise<void> {
  // Store by tweet ID to avoid duplicates if processed multiple times
  db.detectedLaunches.set(launch.id, launch);
}

/**
 * Get recently detected launches (e.g., last 50).
 */
export const getRecentDetectedLaunches = cache(async (limit: number = 50): Promise<DetectedLaunch[]> => {
  return Array.from(db.detectedLaunches.values())
    .sort((a, b) => b.detectedAt - a.detectedAt) // Sort by detection time, newest first
    .slice(0, limit);
}); 