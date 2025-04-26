// Semantic search utilities for finding related tweets

import { cache } from "react"
import type { TwitterTweet } from "@/types/twitter"
import { extractHashtags } from "./hashtag-utils"
import { AssociationRule } from "./association-rule-mining"

/**
 * Calculate TF-IDF (Term Frequency-Inverse Document Frequency) for tweet corpus
 */
export function calculateTfIdf(tweets: TwitterTweet[]): {
  tfidf: Map<string, Map<string, number>>,
  idf: Map<string, number>
} {
  // Extract terms from tweets
  const documents = tweets.map(tweet => {
    // Clean and tokenize text
    return tweet.text
      .toLowerCase()
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[^\w\s#@]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 2 && !term.startsWith('@'))
  })
  
  // Calculate document frequency
  const df = new Map<string, number>()
  documents.forEach(terms => {
    // Count each term only once per document
    const uniqueTerms = new Set(terms)
    uniqueTerms.forEach(term => {
      df.set(term, (df.get(term) || 0) + 1)
    })
  })
  
  // Calculate inverse document frequency
  const idf = new Map<string, number>()
  const N = documents.length
  df.forEach((freq, term) => {
    idf.set(term, Math.log(N / freq))
  })
  
  // Calculate TF-IDF for each term in each document
  const tfidf = new Map<string, Map<string, number>>()
  
  documents.forEach((terms, docIndex) => {
    const tweetId = tweets[docIndex].id
    tfidf.set(tweetId, new Map<string, number>())
    
    // Count term frequency in this document
    const tf = new Map<string, number>()
    terms.forEach(term => {
      tf.set(term, (tf.get(term) || 0) + 1)
    })
    
    // Calculate TF-IDF for each term
    tf.forEach((freq, term) => {
      const termIdf = idf.get(term) || 0
      tfidf.get(tweetId)!.set(term, freq * termIdf)
    })
  })
  
  return { tfidf, idf }
}

/**
 * Find tweets related to a topic using TF-IDF and association rules
 */
export const findRelatedTweets = cache(async (
  tweets: TwitterTweet[],
  topic: string,
  rules: AssociationRule[],
  limit: number = 20
): Promise<TwitterTweet[]> => {
  // If no tweets, return empty array
  if (tweets.length === 0) return []
  
  // Calculate TF-IDF for corpus
  const { tfidf, idf } = calculateTfIdf(tweets)
  
  // Find related terms using association rules
  const relatedTerms = new Map<string, number>()
  
  // Add the topic itself with highest weight
  relatedTerms.set(topic.toLowerCase(), 1.0)
  
  // Add hashtag version of the topic
  if (!topic.startsWith('#')) {
    relatedTerms.set(`#${topic.toLowerCase()}`, 1.0)
  }
  
  // Find related terms from association rules
  rules.forEach(rule => {
    // Check if topic is in antecedent
    if (rule.antecedent.some(term => term.toLowerCase() === topic.toLowerCase())) {
      rule.consequent.forEach(term => {
        relatedTerms.set(term.toLowerCase(), (relatedTerms.get(term.toLowerCase()) || 0) + rule.confidence)
      })
    }
    
    // Check if topic is in consequent
    if (rule.consequent.some(term => term.toLowerCase() === topic.toLowerCase())) {
      rule.antecedent.forEach(term => {
        relatedTerms.set(term.toLowerCase(), (relatedTerms.get(term.toLowerCase()) || 0) + rule.confidence)
      })
    }
  })
  
  // Score tweets based on related terms
  const scores = new Map<string, number>()
  
  tweets.forEach(tweet => {
    let score = 0
    
    // Check if tweet directly contains the topic
    if (tweet.text.toLowerCase().includes(topic.toLowerCase())) {
      score += 5 // Direct mention gets high score
    }
    
    // Check for hashtags
    const hashtags = extractHashtags(tweet.text)
    if (hashtags.some(tag => tag.toLowerCase() === topic.toLowerCase())) {
      score += 3 // Hashtag mention gets medium-high score
    }
    
    // Score based on TF-IDF and related terms
    const tweetTfidf = tfidf.get(tweet.id)
    if (tweetTfidf) {
      relatedTerms.forEach((weight, term) => {
        const termScore = tweetTfidf.get(term) || 0
        score += termScore * weight
      })
    }
    
    scores.set(tweet.id, score)
  })
  
  // Sort tweets by score and return top results
  return tweets
    .filter(tweet => scores.get(tweet.id)! > 0)
    .sort((a, b) => (scores.get(b.id) || 0) - (scores.get(a.id) || 0))
    .slice(0, limit)
})

/**
 * Find trending topics based on tweet frequency and association rules
 */
export const findTrendingTopics = cache(async (
  tweets: TwitterTweet[],
  rules: AssociationRule[],
  limit: number = 10
): Promise<Array<{
  topic: string,
  score: number,
  relatedTerms: string[]
}>> => {
  // Extract all hashtags
  const allHashtags = tweets.flatMap(tweet => extractHashtags(tweet.text))
  
  // Count hashtag frequency
  const hashtagCounts = new Map<string, number>()
  allHashtags.forEach(tag => {
    hashtagCounts.set(tag, (hashtagCounts.get(tag) || 0) + 1)
  })
  
  // Score topics based on frequency and association strength
  const topicScores = new Map<string, {
    score: number,
    relatedTerms: Set<string>
  }>()
  
  // Add scores from hashtag frequency
  hashtagCounts.forEach((count, tag) => {
    topicScores.set(tag, {
      score: count,
      relatedTerms: new Set<string>()
    })
  })
  
  // Add scores from association rules
  rules.forEach(rule => {
    // Process antecedents
    rule.antecedent.forEach(term => {
      if (!topicScores.has(term)) {
        topicScores.set(term, {
          score: 0,
          relatedTerms: new Set<string>()
        })
      }
      
      const topicData = topicScores.get(term)!
      
      // Add score based on confidence and lift
      topicData.score += rule.confidence * rule.lift
      
      // Add related terms
      rule.consequent.forEach(relatedTerm => {
        topicData.relatedTerms.add(relatedTerm)
      })
    })
    
    // Process consequents
    rule.consequent.forEach(term => {
      if (!topicScores.has(term)) {
        topicScores.set(term, {
          score: 0,
          relatedTerms: new Set<string>()
        })
      }
      
      const topicData = topicScores.get(term)!
      
      // Add score based on confidence and lift
      topicData.score += rule.confidence * rule.lift
      
      // Add related terms
      rule.antecedent.forEach(relatedTerm => {
        topicData.relatedTerms.add(relatedTerm)
      })
    })
  })
  
  // Convert to array and sort by score
  return Array.from(topicScores.entries())
    .map(([topic, { score, relatedTerms }]) => ({
      topic,
      score,
      relatedTerms: Array.from(relatedTerms)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}) 