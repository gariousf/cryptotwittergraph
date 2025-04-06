import { createHashtagTransactions } from './hashtag-utils'

// Interface for an itemset with its support
interface ItemsetWithSupport {
  itemset: Set<string>
  support: number
}

// Interface for an association rule
export interface AssociationRule {
  antecedent: string[]
  consequent: string[]
  support: number
  confidence: number
  lift: number
}

/**
 * Implementation of the Apriori algorithm for frequent itemset mining
 */
export class Apriori {
  private transactions: string[][]
  private minSupport: number
  private minConfidence: number
  private frequentItemsets: Map<number, ItemsetWithSupport[]> = new Map()
  
  constructor(
    transactions: string[][],
    minSupport: number = 0.01,
    minConfidence: number = 0.5
  ) {
    this.transactions = transactions
    this.minSupport = minSupport
    this.minConfidence = minConfidence
  }
  
  /**
   * Run the Apriori algorithm
   */
  run(): AssociationRule[] {
    this.generateFrequentItemsets()
    return this.generateAssociationRules()
  }
  
  /**
   * Generate frequent itemsets using the Apriori algorithm
   */
  private generateFrequentItemsets(): void {
    // Generate frequent 1-itemsets
    const candidates1 = this.generateCandidates1()
    const frequent1 = this.filterFrequentItemsets(candidates1)
    this.frequentItemsets.set(1, frequent1)
    
    // Generate frequent k-itemsets
    let k = 2
    while (this.frequentItemsets.get(k - 1)!.length > 0) {
      const candidatesK = this.generateCandidatesK(k)
      const frequentK = this.filterFrequentItemsets(candidatesK)
      
      if (frequentK.length > 0) {
        this.frequentItemsets.set(k, frequentK)
      }
      
      k++
    }
  }
  
  /**
   * Generate candidate 1-itemsets
   */
  private generateCandidates1(): ItemsetWithSupport[] {
    const itemCounts = new Map<string, number>()
    
    // Count occurrences of each item
    this.transactions.forEach(transaction => {
      transaction.forEach(item => {
        itemCounts.set(item, (itemCounts.get(item) || 0) + 1)
      })
    })
    
    // Create candidate 1-itemsets
    return Array.from(itemCounts.entries()).map(([item, count]) => ({
      itemset: new Set([item]),
      support: count / this.transactions.length
    }))
  }
  
  /**
   * Generate candidate k-itemsets from frequent (k-1)-itemsets
   */
  private generateCandidatesK(k: number): ItemsetWithSupport[] {
    const frequentPrev = this.frequentItemsets.get(k - 1)!
    const candidates: ItemsetWithSupport[] = []
    
    // Join step: generate candidates
    for (let i = 0; i < frequentPrev.length; i++) {
      for (let j = i + 1; j < frequentPrev.length; j++) {
        const itemset1 = Array.from(frequentPrev[i].itemset)
        const itemset2 = Array.from(frequentPrev[j].itemset)
        
        // Check if first k-2 items are the same
        let canJoin = true
        for (let l = 0; l < k - 2; l++) {
          if (itemset1[l] !== itemset2[l]) {
            canJoin = false
            break
          }
        }
        
        if (canJoin && itemset1[k - 2] < itemset2[k - 2]) {
          // Create new candidate itemset
          const newItemset = new Set([...itemset1, itemset2[k - 2]])
          
          // Prune step: check if all subsets are frequent
          if (this.allSubsetsAreFrequent(newItemset, k)) {
            candidates.push({
              itemset: newItemset,
              support: 0 // Will be calculated later
            })
          }
        }
      }
    }
    
    // Calculate support for candidates
    candidates.forEach(candidate => {
      let count = 0
      const candidateArray = Array.from(candidate.itemset)
      
      this.transactions.forEach(transaction => {
        if (candidateArray.every(item => transaction.includes(item))) {
          count++
        }
      })
      
      candidate.support = count / this.transactions.length
    })
    
    return candidates
  }
  
  /**
   * Check if all k-1 subsets of an itemset are frequent
   */
  private allSubsetsAreFrequent(itemset: Set<string>, k: number): boolean {
    const itemsetArray = Array.from(itemset)
    const frequentPrev = this.frequentItemsets.get(k - 1)!
    
    // Generate all k-1 subsets
    for (let i = 0; i < itemsetArray.length; i++) {
      const subset = new Set(itemsetArray)
      subset.delete(itemsetArray[i])
      
      // Check if subset is frequent
      if (!frequentPrev.some(frequent => 
        this.setsEqual(frequent.itemset, subset)
      )) {
        return false
      }
    }
    
    return true
  }
  
  /**
   * Filter itemsets by minimum support
   */
  private filterFrequentItemsets(candidates: ItemsetWithSupport[]): ItemsetWithSupport[] {
    return candidates.filter(candidate => candidate.support >= this.minSupport)
  }
  
  /**
   * Generate association rules from frequent itemsets
   */
  private generateAssociationRules(): AssociationRule[] {
    const rules: AssociationRule[] = []
    
    // Iterate through frequent itemsets of size >= 2
    for (let k = 2; k <= Math.max(...this.frequentItemsets.keys()); k++) {
      const frequentK = this.frequentItemsets.get(k) || []
      
      frequentK.forEach(frequent => {
        const itemsetArray = Array.from(frequent.itemset)
        
        // Generate all non-empty proper subsets as antecedents
        this.generateAllSubsets(itemsetArray).forEach(subset => {
          if (subset.length === 0 || subset.length === itemsetArray.length) return
          
          const antecedent = subset
          const consequent = itemsetArray.filter(item => !subset.includes(item))
          
          // Calculate confidence
          const antecedentSet = new Set(antecedent)
          const antecedentSupport = this.getSupport(antecedentSet)
          const confidence = frequent.support / antecedentSupport
          
          if (confidence >= this.minConfidence) {
            // Calculate lift
            const consequentSet = new Set(consequent)
            const consequentSupport = this.getSupport(consequentSet)
            const lift = confidence / consequentSupport
            
            rules.push({
              antecedent,
              consequent,
              support: frequent.support,
              confidence,
              lift
            })
          }
        })
      })
    }
    
    return rules
  }
  
  /**
   * Generate all subsets of an array
   */
  private generateAllSubsets(arr: string[]): string[][] {
    const subsets: string[][] = [[]]
    
    arr.forEach(item => {
      const newSubsets = subsets.map(subset => [...subset, item])
      subsets.push(...newSubsets)
    })
    
    return subsets
  }
  
  /**
   * Get support of an itemset
   */
  private getSupport(itemset: Set<string>): number {
    const size = itemset.size
    const frequentItemsets = this.frequentItemsets.get(size) || []
    
    const found = frequentItemsets.find(frequent => 
      this.setsEqual(frequent.itemset, itemset)
    )
    
    return found ? found.support : 0
  }
  
  /**
   * Check if two sets are equal
   */
  private setsEqual(set1: Set<string>, set2: Set<string>): boolean {
    if (set1.size !== set2.size) return false
    
    for (const item of set1) {
      if (!set2.has(item)) return false
    }
    
    return true
  }
}

/**
 * Run association rule mining on tweets
 */
export function mineAssociationRules(
  tweets: any[],
  minSupport: number = 0.01,
  minConfidence: number = 0.5
): AssociationRule[] {
  // Create transactions from tweets
  const transactions = createHashtagTransactions(tweets)
  
  // Run Apriori algorithm
  const apriori = new Apriori(transactions, minSupport, minConfidence)
  return apriori.run()
} 