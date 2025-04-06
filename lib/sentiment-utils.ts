// Client-side sentiment utilities (no "use server" directive)
import type { SentimentType } from "./sentiment-service"

// Sentiment color based on type
export function getSentimentColor(type: SentimentType | string): string {
  switch (type) {
    case "very-negative":
      return "#ef4444" // red-500
    case "negative":
      return "#f97316" // orange-500
    case "neutral":
      return "#6b7280" // gray-500
    case "positive":
      return "#10b981" // emerald-500
    case "very-positive":
      return "#22c55e" // green-500
    default:
      return "#6b7280" // gray-500
  }
}

// Sentiment emoji based on type
export function getSentimentEmoji(type: SentimentType): string {
  switch (type) {
    case "very-negative":
      return "😡"
    case "negative":
      return "😟"
    case "neutral":
      return "😐"
    case "positive":
      return "🙂"
    case "very-positive":
      return "😄"
    default:
      return "😐"
  }
} 