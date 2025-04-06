"use server"

import { cache } from "react"
import { AssociationRule } from "./association-rule-mining"
import { HighUtilityPattern } from "./high-utility-pattern-mining"
import { RuleChange } from "./transaction-rule-change-mining"

// In-memory database for simplicity
// In a real application, you would use a proper database
const db = {
  patterns: new Map<string, HighUtilityPattern[]>(),
  rules: new Map<string, AssociationRule[]>(),
  changes: new Map<string, RuleChange[]>(),
  windows: new Map<string, any[]>()
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
  tweets: any[]
): Promise<void> {
  db.windows.set(windowKey, tweets)
}

/**
 * Get window from database
 */
export const getWindow = cache(async (
  windowKey: string
): Promise<any[]> => {
  return db.windows.get(windowKey) || []
})

/**
 * Get all window keys
 */
export const getWindowKeys = cache(async (): Promise<string[]> => {
  return Array.from(db.windows.keys()).sort()
}) 