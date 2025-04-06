import type { TwitterUser } from "@/types/twitter"

// Calculate KOL score based on various metrics
export function calculateKolScore(user: TwitterUser): number | undefined {
  if (!user.public_metrics) return undefined

  const { followers_count, following_count, tweet_count } = user.public_metrics

  // Skip if not enough data
  if (!followers_count) return undefined

  // Base score from followers (max 70 points)
  let score = Math.min(70, Math.log10(followers_count) * 15)

  // Follower to following ratio (max 15 points)
  if (following_count && following_count > 0) {
    const ratio = followers_count / following_count
    score += Math.min(15, ratio * 1.5)
  }

  // Activity score based on tweet count (max 15 points)
  if (tweet_count) {
    score += Math.min(15, Math.log10(tweet_count) * 5)
  }

  // Check for crypto keywords in description (bonus points)
  const description = (user.description || "").toLowerCase()
  const cryptoKeywords = [
    "crypto",
    "blockchain",
    "bitcoin",
    "ethereum",
    "web3",
    "defi",
    "nft",
    "token",
    "analyst",
    "trader",
    "investor",
  ]

  const keywordMatches = cryptoKeywords.filter((keyword) => description.includes(keyword)).length

  score += keywordMatches * 2

  // Cap at 100
  return Math.min(100, Math.round(score))
}

// Determine if a user is likely a KOL based on score and profile
export function isLikelyKol(user: TwitterUser): boolean {
  const score = calculateKolScore(user)
  if (!score) return false

  // High score is a strong indicator
  if (score >= 75) return true

  // Medium score with crypto keywords
  const description = (user.description || "").toLowerCase()
  if (
    score >= 60 &&
    (description.includes("crypto") ||
      description.includes("blockchain") ||
      description.includes("bitcoin") ||
      description.includes("analyst") ||
      description.includes("expert"))
  ) {
    return true
  }

  // Explicit KOL mentions
  if (
    description.includes("kol") ||
    description.includes("key opinion leader") ||
    description.includes("thought leader") ||
    description.includes("crypto analyst") ||
    description.includes("crypto expert")
  ) {
    return true
  }

  return false
}

