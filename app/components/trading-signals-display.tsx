"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, ArrowUp, ArrowDown, Eye, Info, Bot } from "lucide-react"
import type { TradingSignal, SignalType } from "@/types/signals"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TradingSignalsDisplayProps {
  signals: TradingSignal[];
  title?: string;
  maxHeight?: string;
}

function getSignalIcon(type: SignalType) {
  switch (type) {
    case 'BUY': return <ArrowUp className="h-4 w-4 text-green-500" />;
    case 'SELL': return <ArrowDown className="h-4 w-4 text-red-500" />;
    case 'WATCH_STRONG': return <Eye className="h-4 w-4 text-yellow-500" />;
    case 'WATCH_WEAK': return <Eye className="h-4 w-4 text-blue-400" />;
    case 'NEUTRAL': return <Info className="h-4 w-4 text-gray-500" />;
    default: return <Bot className="h-4 w-4 text-purple-500" />; // For system messages/errors
  }
}

function getSignalColor(type: SignalType): string {
  switch (type) {
    case 'BUY': return "border-green-500/50 bg-green-500/10";
    case 'SELL': return "border-red-500/50 bg-red-500/10";
    case 'WATCH_STRONG': return "border-yellow-500/50 bg-yellow-500/10";
    case 'WATCH_WEAK': return "border-blue-400/50 bg-blue-400/10";
    case 'NEUTRAL': return "border-gray-500/50 bg-gray-500/10";
    default: return "border-purple-500/50 bg-purple-500/10";
  }
}

export function TradingSignalsDisplay({
  signals,
  title = "Trading Signals",
  maxHeight = "400px"
}: TradingSignalsDisplayProps) {

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          {title}
        </CardTitle>
        <CardDescription>Algorithmic signals based on market and social data analysis.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea style={{ maxHeight: maxHeight }} className="pr-4">
          {signals.length === 0 ? (
            <div className="text-center py-6 text-gray-400">No signals generated yet.</div>
          ) : (
            <div className="space-y-3">
              {signals.map((signal) => (
                <TooltipProvider key={signal.id} delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={`p-3 rounded-md border ${getSignalColor(signal.type)}`}>
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-2">
                            {getSignalIcon(signal.type)}
                            <span className="font-semibold text-sm">{signal.type.replace('_', ' ')}</span>
                            {signal.targetAsset && <Badge variant="secondary">{signal.targetAsset}</Badge>}
                            {signal.topic && <Badge variant="outline">#{signal.topic}</Badge>}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {new Date(signal.timestamp).toLocaleTimeString()}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">{signal.reason}</p>
                        <div className="flex justify-between items-center text-xs">
                           <span className="text-muted-foreground">Source: {signal.source}</span>
                           <span className={`font-medium ${signal.strength > 0.7 ? 'text-primary' : signal.strength > 0.4 ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                             Strength: {(signal.strength * 100).toFixed(0)}%
                           </span>
                        </div>
                         {signal.influencer && (
                            <p className="text-xs mt-1 text-blue-600 dark:text-blue-400">Influencer: @{signal.influencer.username}</p>
                         )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p className="text-xs max-w-xs">
                        ID: {signal.id}<br />
                        Timestamp: {new Date(signal.timestamp).toLocaleString()}<br />
                        {signal.relatedData && (
                          <>
                           <span className="font-semibold">Details:</span> {JSON.stringify(signal.relatedData)}
                          </>
                        )}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
} 