import { extractHashtags } from './hashtag-utils'

// Interface for a utility item
interface UtilityItem {
  item: string
  utility: number
  frequency: number
}

// Interface for a high utility pattern
export interface HighUtilityPattern {
  pattern: string[]
  utility: number
  frequency: number
}

/**
 * Implementation of the High Utility Pattern Mining algorithm
 */
export class HUPM {
  private tweets: any[]
  private previousWindow: any[] | null
  private minUtility: number
  private minFrequency: number
  
  constructor(
    tweets: any[],
    previousWindow: any[] | null = null,
    minUtility: number = 0.1,
    minFrequency: number = 3
  ) {
    this.tweets = tweets
    this.previousWindow = previousWindow
    this.minUtility = minUtility
    this.minFrequency = minFrequency
  }
  
  /**
   * Run the HUPM algorithm
   */
  run(): HighUtilityPattern[] {
    // Calculate utility of each hashtag
    const utilities = this.calculateUtilities()
    
    // Generate candidate patterns
    const candidates = this.generateCandidatePatterns(utilities)
    
    // Filter high utility patterns
    return this.filterHighUtilityPatterns(candidates)
  }
  
  /**
   * Calculate utility of each hashtag based on growth rate
   */
  private calculateUtilities(): Map<string, UtilityItem> {
    const currentFrequency = new Map<string, number>()
    const utilities = new Map<string, UtilityItem>()
    
    // Calculate current frequency
    this.tweets.forEach(tweet => {
      const hashtags = extractHashtags(tweet.text)
      
      hashtags.forEach(tag => {
        currentFrequency.set(tag, (currentFrequency.get(tag) || 0) + 1)
      })
    })
    
    // Calculate previous frequency if available
    const previousFrequency = new Map<string, number>()
    
    if (this.previousWindow) {
      this.previousWindow.forEach(tweet => {
        const hashtags = extractHashtags(tweet.text)
        
        hashtags.forEach(tag => {
          previousFrequency.set(tag, (previousFrequency.get(tag) || 0) + 1)
        })
      })
    }
    
    // Calculate utility based on growth rate
    currentFrequency.forEach((freq, tag) => {
      const prevFreq = previousFrequency.get(tag) || 0
      
      // Calculate growth rate
      let growthRate = 0
      if (prevFreq === 0) {
        // New hashtag, high utility
        growthRate = 1
      } else {
        growthRate = (freq - prevFreq) / prevFreq
      }
      
      // Normalize growth rate to [0, 1]
      const normalizedGrowthRate = Math.max(0, Math.min(1, (growthRate + 1) / 2))
      
      utilities.set(tag, {
        item: tag,
        utility: normalizedGrowthRate,
        frequency: freq
      })
    })
    
    return utilities
  }
  
  /**
   * Generate candidate patterns using TP-Tree
   */
  private generateCandidatePatterns(utilities: Map<string, UtilityItem>): HighUtilityPattern[] {
    // Create TP-Tree
    const tpTree = new TPTree()
    
    // Insert tweets into TP-Tree
    this.tweets.forEach(tweet => {
      const hashtags = extractHashtags(tweet.text)
        .filter(tag => utilities.has(tag))
        .sort((a, b) => {
          const utilityA = utilities.get(a)!
          const utilityB = utilities.get(b)!
          
          // Sort by utility, then by frequency
          if (utilityA.utility !== utilityB.utility) {
            return utilityB.utility - utilityA.utility
          }
          
          return utilityB.frequency - utilityA.frequency
        })
      
      if (hashtags.length > 0) {
        tpTree.insert(hashtags)
      }
    })
    
    // Mine patterns from TP-Tree
    return tpTree.minePatterns(utilities, this.minFrequency)
  }
  
  /**
   * Filter high utility patterns
   */
  private filterHighUtilityPatterns(candidates: HighUtilityPattern[]): HighUtilityPattern[] {
    return candidates
      .filter(pattern => pattern.utility >= this.minUtility)
      .sort((a, b) => b.utility - a.utility)
  }
}

/**
 * TP-Tree node
 */
class TPTreeNode {
  item: string | null
  count: number
  children: Map<string, TPTreeNode>
  
  constructor(item: string | null = null) {
    this.item = item
    this.count = 0
    this.children = new Map()
  }
}

/**
 * TP-Tree (Topic Tree) for efficient pattern mining
 */
class TPTree {
  private root: TPTreeNode
  
  constructor() {
    this.root = new TPTreeNode()
  }
  
  /**
   * Insert a transaction into the tree
   */
  insert(items: string[]): void {
    let current = this.root
    
    items.forEach(item => {
      if (!current.children.has(item)) {
        current.children.set(item, new TPTreeNode(item))
      }
      
      current = current.children.get(item)!
      current.count++
    })
  }
  
  /**
   * Mine patterns from the tree
   */
  minePatterns(
    utilities: Map<string, UtilityItem>,
    minFrequency: number
  ): HighUtilityPattern[] {
    const patterns: HighUtilityPattern[] = []
    
    // Recursive function to traverse the tree
    const traverse = (
      node: TPTreeNode,
      currentPattern: string[],
      currentUtility: number,
      currentFrequency: number
    ) => {
      // Skip root node
      if (node.item !== null) {
        const newPattern = [...currentPattern, node.item]
        const itemUtility = utilities.get(node.item)!.utility
        
        // Calculate pattern utility as average of item utilities
        const newUtility = (currentUtility * currentPattern.length + itemUtility) / newPattern.length
        
        // Add pattern if it meets minimum frequency
        if (node.count >= minFrequency) {
          patterns.push({
            pattern: newPattern,
            utility: newUtility,
            frequency: node.count
          })
        }
        
        // Traverse children
        node.children.forEach(child => {
          traverse(child, newPattern, newUtility, node.count)
        })
      } else {
        // Root node, traverse children
        node.children.forEach(child => {
          traverse(child, [], 0, 0)
        })
      }
    }
    
    traverse(this.root, [], 0, 0)
    
    return patterns
  }
}

/**
 * Run high utility pattern mining on tweets
 */
export function mineHighUtilityPatterns(
  tweets: any[],
  previousWindow: any[] | null = null,
  minUtility: number = 0.1,
  minFrequency: number = 3
): HighUtilityPattern[] {
  const hupm = new HUPM(tweets, previousWindow, minUtility, minFrequency)
  return hupm.run()
} 