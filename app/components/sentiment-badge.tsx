import { Badge } from "@/components/ui/badge"
import { getSentimentColor, getSentimentEmoji } from "@/lib/sentiment-utils"
import type { SentimentType } from "@/lib/sentiment-service"

interface SentimentBadgeProps {
  type: SentimentType | string
  showEmoji?: boolean
  className?: string
}

export function SentimentBadge({ type, showEmoji = true, className = "" }: SentimentBadgeProps) {
  const color = getSentimentColor(type)
  const emoji = showEmoji ? getSentimentEmoji(type as SentimentType) : null
  
  return (
    <Badge
      variant="outline"
      style={{
        backgroundColor: `${color}20`, // 20% opacity
        color: color,
        borderColor: `${color}40` // 40% opacity
      }}
      className={className}
    >
      {emoji && <span className="mr-1">{emoji}</span>}
      {type.replace('-', ' ')}
    </Badge>
  )
} 