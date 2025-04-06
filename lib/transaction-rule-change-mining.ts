import { AssociationRule, mineAssociationRules } from './association-rule-mining'

// Interface for a rule change
export interface RuleChange {
  rule: AssociationRule
  changeType: 'new' | 'emerging' | 'declining' | 'stable'
  growthRate: number
}

/**
 * Implementation of Transaction-based Rule Change Mining
 */
export class TRCM {
  private currentWindow: any[]
  private previousWindow: any[] | null
  private minSupport: number
  private minConfidence: number
  
  constructor(
    currentWindow: any[],
    previousWindow: any[] | null = null,
    minSupport: number = 0.01,
    minConfidence: number = 0.5
  ) {
    this.currentWindow = currentWindow
    this.previousWindow = previousWindow
    this.minSupport = minSupport
    this.minConfidence = minConfidence
  }
  
  /**
   * Run the TRCM algorithm
   */
  run(): RuleChange[] {
    // Mine rules from current window
    const currentRules = mineAssociationRules(
      this.currentWindow,
      this.minSupport,
      this.minConfidence
    )
    
    // If no previous window, all rules are new
    if (!this.previousWindow) {
      return currentRules.map(rule => ({
        rule,
        changeType: 'new',
        growthRate: Infinity
      }))
    }
    
    // Mine rules from previous window
    const previousRules = mineAssociationRules(
      this.previousWindow,
      this.minSupport,
      this.minConfidence
    )
    
    // Create maps for efficient lookup
    const previousRuleMap = new Map<string, AssociationRule>()
    previousRules.forEach(rule => {
      previousRuleMap.set(this.getRuleKey(rule), rule)
    })
    
    // Detect changes
    const changes: RuleChange[] = []
    
    currentRules.forEach(rule => {
      const ruleKey = this.getRuleKey(rule)
      const previousRule = previousRuleMap.get(ruleKey)
      
      if (!previousRule) {
        // New rule
        changes.push({
          rule,
          changeType: 'new',
          growthRate: Infinity
        })
      } else {
        // Existing rule, calculate growth rate
        const supportGrowthRate = (rule.support - previousRule.support) / previousRule.support
        const confidenceGrowthRate = (rule.confidence - previousRule.confidence) / previousRule.confidence
        
        // Use average of support and confidence growth rates
        const growthRate = (supportGrowthRate + confidenceGrowthRate) / 2
        
        let changeType: 'emerging' | 'declining' | 'stable'
        if (growthRate > 0.2) {
          changeType = 'emerging'
        } else if (growthRate < -0.2) {
          changeType = 'declining'
        } else {
          changeType = 'stable'
        }
        
        changes.push({
          rule,
          changeType,
          growthRate
        })
      }
    })
    
    return changes
  }
  
  /**
   * Get a unique key for a rule
   */
  private getRuleKey(rule: AssociationRule): string {
    const antecedent = [...rule.antecedent].sort().join(',')
    const consequent = [...rule.consequent].sort().join(',')
    return `${antecedent}=>${consequent}`
  }
}

/**
 * Run transaction-based rule change mining on tweets
 */
export function detectRuleChanges(
  currentWindow: any[],
  previousWindow: any[] | null = null,
  minSupport: number = 0.01,
  minConfidence: number = 0.5
): RuleChange[] {
  const trcm = new TRCM(currentWindow, previousWindow, minSupport, minConfidence)
  return trcm.run()
} 