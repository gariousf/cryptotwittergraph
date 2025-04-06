// Utility functions for hashtag processing and analysis

/**
 * Extract hashtags from tweet text
 */
export function extractHashtags(text: string): string[] {
  const hashtagRegex = /#(\w+)/g
  const matches = text.match(hashtagRegex) || []
  return matches.map(tag => tag.toLowerCase())
}

/**
 * Group tweets by time windows
 * @param tweets Array of tweets
 * @param windowSize Size of time window in minutes
 */
export function groupTweetsByTimeWindow(
  tweets: any[], 
  windowSize: number = 60
): Record<string, any[]> {
  const windows: Record<string, any[]> = {}
  
  tweets.forEach(tweet => {
    if (!tweet.created_at) return
    
    const tweetDate = new Date(tweet.created_at)
    // Round to nearest window
    const windowTime = new Date(
      Math.floor(tweetDate.getTime() / (windowSize * 60000)) * (windowSize * 60000)
    )
    const windowKey = windowTime.toISOString()
    
    if (!windows[windowKey]) {
      windows[windowKey] = []
    }
    
    windows[windowKey].push(tweet)
  })
  
  return windows
}

/**
 * Create transactions from tweets for association rule mining
 * Each transaction is a set of hashtags from a tweet
 */
export function createHashtagTransactions(tweets: any[]): string[][] {
  return tweets
    .map(tweet => {
      // Extract hashtags from tweet text
      const hashtags = extractHashtags(tweet.text)
      // Only return non-empty transactions
      return hashtags.length > 0 ? hashtags : null
    })
    .filter(Boolean) as string[][]
}

/**
 * Calculate hashtag frequency in a set of tweets
 */
export function calculateHashtagFrequency(tweets: any[]): Map<string, number> {
  const frequency = new Map<string, number>()
  
  tweets.forEach(tweet => {
    const hashtags = extractHashtags(tweet.text)
    
    hashtags.forEach(tag => {
      frequency.set(tag, (frequency.get(tag) || 0) + 1)
    })
  })
  
  return frequency
}

/**
 * Calculate co-occurrence of hashtags
 */
export function calculateHashtagCooccurrence(tweets: any[]): Map<string, Map<string, number>> {
  const cooccurrence = new Map<string, Map<string, number>>()
  
  tweets.forEach(tweet => {
    const hashtags = extractHashtags(tweet.text)
    
    // Skip tweets with less than 2 hashtags
    if (hashtags.length < 2) return
    
    // For each pair of hashtags, increment co-occurrence
    for (let i = 0; i < hashtags.length; i++) {
      for (let j = i + 1; j < hashtags.length; j++) {
        const tag1 = hashtags[i]
        const tag2 = hashtags[j]
        
        // Ensure tag1 is lexicographically smaller than tag2 for consistency
        const [smallerTag, largerTag] = tag1 < tag2 ? [tag1, tag2] : [tag2, tag1]
        
        if (!cooccurrence.has(smallerTag)) {
          cooccurrence.set(smallerTag, new Map<string, number>())
        }
        
        const innerMap = cooccurrence.get(smallerTag)!
        innerMap.set(largerTag, (innerMap.get(largerTag) || 0) + 1)
      }
    }
  })
  
  return cooccurrence
} 