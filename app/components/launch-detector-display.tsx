"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { ExternalLink, FileText, Key, Link as LinkIcon, Tags, Rss, TrendingUp, MessageSquare, Users, Smile, Brain, Bot } from "lucide-react"
import type { DetectedLaunch } from "@/types/launch-detector"
import { getInitials, formatNumber } from "@/lib/ui-helpers"
import Link from 'next/link'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { SentimentBadge } from "./sentiment-badge"
import { getSentimentColor } from "@/lib/sentiment-utils"

// Function to fetch recent launches (replace with API route/server action if needed)
async function fetchRecentLaunches(): Promise<DetectedLaunch[]> {
    // In a real app, this might be an API call or Server Action
    // For now, we assume direct access to the function for simplicity
    // If using API route: const response = await fetch('/api/detected-launches'); return await response.json();
    try {
        // This assumes db-service functions can be called directly server-side
        // If not, create an API endpoint `/api/detected-launches` that calls this
        const { getRecentDetectedLaunches } = await import("@/lib/db-service");
        return await getRecentDetectedLaunches(50); // Fetch last 50
    } catch (error) {
        console.error("Error fetching recent launches:", error);
        return [];
    }
}

// Helper to format score
function formatImpactScore(score: number | undefined): string {
    if (score === undefined) return "N/A";
    return `${(score * 100).toFixed(0)}%`;
}

export function LaunchDetectorDisplay() {
    const [launches, setLaunches] = useState<DetectedLaunch[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadLaunches = async () => {
            // Only set loading on initial load
            // setIsLoading(true);
            setError(null);
            try {
                const { getRecentDetectedLaunches } = await import("@/lib/db-service");
                const fetchedLaunches = await getRecentDetectedLaunches(50);
                // Only update if data is different? Basic check for now.
                if (JSON.stringify(fetchedLaunches) !== JSON.stringify(launches)) {
                    setLaunches(fetchedLaunches);
                }
            } catch (err) {
                setError("Failed to load detected content.");
                console.error(err);
            } finally {
                // Ensure loading is false after first fetch
                if(isLoading) setIsLoading(false);
            }
        };

        loadLaunches(); // Initial load
        const intervalId = setInterval(loadLaunches, 30000); // Poll every 30 seconds
        return () => clearInterval(intervalId);
    }, [launches, isLoading]); // Add launches, isLoading to dependency array

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Rss /> Monitored Account Activity</CardTitle>
                <CardDescription>Analyzed content (tweets/replies) from monitored accounts.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
                        </div>
                    ) : error ? (
                        <p className="text-center text-red-500 py-4">{error}</p>
                    ) : launches.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">No significant content detected recently.</p>
                    ) : (
                        <div className="space-y-4">
                            {launches.map((item) => (
                                <div key={item.id} className="p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors relative overflow-hidden">
                                     {/* Impact Score Bar */}
                                     <div
                                         className="absolute top-0 left-0 bottom-0 opacity-20"
                                         style={{
                                             width: `${(item.potentialImpactScore || 0) * 100}%`,
                                             // Use sentiment color for background intensity
                                             backgroundColor: item.sentimentAnalysis ? getSentimentColor(item.sentimentAnalysis.type) : 'transparent',
                                             transition: 'width 0.5s ease-in-out'
                                         }}
                                    />

                                    {/* Content Wrapper Relative to allow absolute positioning inside */}
                                    <div className="relative z-10">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={item.author.profile_image_url} />
                                                    <AvatarFallback>{getInitials(item.author.name)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-semibold text-sm">{item.author.name}</div>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                         <Link href={`https://twitter.com/${item.author.username}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                                            @{item.author.username}
                                                        </Link>
                                                        <span className="flex items-center gap-1" title="Followers">
                                                            <Users className="h-3 w-3" /> {formatNumber(item.author.public_metrics?.followers_count ?? 0)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs text-muted-foreground block">{new Date(item.detectedAt).toLocaleString()}</span>
                                                 {/* Display Impact Score */}
                                                 <TooltipProvider>
                                                     <Tooltip>
                                                         <TooltipTrigger asChild>
                                                            <div className="flex items-center justify-end gap-1 mt-1 text-xs font-medium">
                                                                <Brain className="h-3 w-3" /> Impact: {formatImpactScore(item.potentialImpactScore)}
                                                            </div>
                                                         </TooltipTrigger>
                                                         <TooltipContent>
                                                             <p>Potential Impact Score based on sentiment, author influence, content.</p>
                                                         </TooltipContent>
                                                     </Tooltip>
                                                 </TooltipProvider>
                                            </div>
                                        </div>

                                        {/* Tweet Content */}
                                        <p className="text-sm mb-2.5 whitespace-pre-wrap">{item.tweet.text}</p>

                                         {/* Analysis Badges Row */}
                                         <div className="flex flex-wrap gap-x-3 gap-y-1.5 items-center text-xs mb-2.5">
                                             {/* Sentiment */}
                                             {item.sentimentAnalysis && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger className="flex items-center">
                                                            <SentimentBadge type={item.sentimentAnalysis.type} showEmoji={true}/>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            Score: {item.sentimentAnalysis.score.toFixed(2)} <br/>
                                                            Emotion: {item.sentimentAnalysis.dominantEmotion || 'N/A'} <br/>
                                                            Aspect: {item.sentimentAnalysis.keyAspect || 'General'}
                                                         </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                             )}
                                              {/* Potential Launch Flag */}
                                             {item.isPotentialLaunch && (
                                                <Badge variant="destructive" className="flex items-center gap-1"><Bot className="h-3 w-3"/> Potential Launch</Badge>
                                             )}
                                             {/* Keywords */}
                                             {item.matchedKeywords.length > 0 && (
                                                <TooltipProvider>
                                                     <Tooltip>
                                                         <TooltipTrigger className="flex items-center gap-1 text-muted-foreground">
                                                             <Tags className="h-3 w-3" /> Keywords
                                                         </TooltipTrigger>
                                                          <TooltipContent>
                                                              {item.matchedKeywords.join(', ')}
                                                          </TooltipContent>
                                                     </Tooltip>
                                                 </TooltipProvider>
                                             )}
                                             {/* Contract */}
                                             {item.potentialContract && (
                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                    <Key className="h-3 w-3" />
                                                    <Badge variant="outline" className="font-mono truncate max-w-[120px] sm:max-w-[150px]">{item.potentialContract}</Badge>
                                                </div>
                                             )}
                                             {/* DEX Link */}
                                             {item.dexLink && (
                                                 <div className="flex items-center gap-1 text-muted-foreground">
                                                     <LinkIcon className="h-3 w-3" />
                                                     <a href={item.dexLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate max-w-[120px] sm:max-w-[150px]">{new URL(item.dexLink).hostname}</a>
                                                 </div>
                                             )}
                                         </div>


                                        {/* Link to Tweet */}
                                        <Link
                                            href={`https://twitter.com/${item.author.username}/status/${item.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-500 hover:underline inline-flex items-center gap-1"
                                        >
                                            View Original <ExternalLink className="h-3 w-3" />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
} 