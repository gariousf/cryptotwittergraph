"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
// Import UI components individually
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
// Other imports
import { fetchTwitterGraph } from "@/app/actions"
// Import types from the component file where they are defined and exported
import { ForceGraph, type LayoutType, type NodeSizeMetric, type NodeColorScheme } from "@/app/components/force-graph"
import { VisualizationControls } from "@/app/components/visualization-controls"
import {
    GraphData,
    GraphNode,
    GraphLink,
    ConnectionType
} from "@/types/twitter"
// Ensure ALL used icons are imported, including Loader2
import { AlertTriangle, User, Users, Link as LinkIcon, Settings, Minimize2, Maximize2, Search, Zap, Loader2 } from "lucide-react"
import { getBorderColorForGroup, getBackgroundColorForGroup, getTextColorForGroup, getInitials, formatNumber, capitalizeFirstLetter } from "@/lib/ui-helpers"

export default function Home() {
    const [username, setUsername] = useState("")
    const [depth, setDepth] = useState(1) // Default depth 1
    const [graphData, setGraphData] = useState<GraphData | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [usingSampleData, setUsingSampleData] = useState(false)
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
    const [selectedNodeConnections, setSelectedNodeConnections] = useState<GraphLink[] | null>(null)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [isFullScreen, setIsFullScreen] = useState(false)

    // Visualization settings state
    const [layout, setLayout] = useState<LayoutType>("force")
    const [nodeSizeMetric, setNodeSizeMetric] = useState<NodeSizeMetric>("followers")
    const [nodeColorScheme, setNodeColorScheme] = useState<NodeColorScheme>("group")

    const mainContainerRef = useRef<HTMLDivElement>(null);


    const loadGraphData = async (searchUsername: string, searchDepth: number) => {
        if (!searchUsername.trim()) return

        setIsLoading(true)
        setError(null)
        setGraphData(null)
        setSelectedNode(null)
        setSelectedNodeConnections(null)
        setIsSidebarOpen(false)
        setUsingSampleData(false)

        try {
            const result = await fetchTwitterGraph(searchUsername, searchDepth)
            if (!result || !result.data || result.data.nodes.length === 0) {
                throw new Error("No graph data returned. The user might not exist or have connections.")
            }
            setGraphData(result.data)
            setUsingSampleData(result.usingSampleData)
            if (result.usingSampleData) {
                setError("Could not fetch live data, showing sample graph.")
            }
        } catch (err: any) {
            console.error("Error fetching graph data:", err)
            setError(err.message || "An error occurred while fetching data.")
            // Optionally load sample data on error
            // const sampleData = getSampleGraphData(searchUsername);
            // setGraphData(sampleData);
            // setUsingSampleData(true);
        } finally {
            setIsLoading(false)
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        const trimmedUsername = username.trim()
        if (trimmedUsername) {
            loadGraphData(trimmedUsername, depth)
        }
    }

    const handleNodeClick = useCallback((nodeId: string) => {
        if (!graphData) return
        const node = graphData.nodes.find((n) => n.id === nodeId)
        if (node) {
            setSelectedNode(node)
            // Find connections involving this node
            const connections = graphData.links.filter(
                (link) => link.source === nodeId || link.target === nodeId
            );
            setSelectedNodeConnections(connections)
            setIsSidebarOpen(true) // Open sidebar when node is clicked
        } else {
            setSelectedNode(null)
            setSelectedNodeConnections(null)
            setIsSidebarOpen(false)
        }
    }, [graphData]) // Dependency on graphData

    const getNodeConnections = () => {
        if (!selectedNode || !graphData) return [];
        return graphData.links.filter(link => link.source === selectedNode.id || link.target === selectedNode.id);
    };

    const getConnectedNode = (link: GraphLink): GraphNode | undefined => {
         if (!graphData || !selectedNode) return undefined;
         const targetId = link.source === selectedNode.id ? link.target : link.source;
         return graphData.nodes.find(node => node.id === targetId);
    };

    const toggleFullScreen = () => {
         const elem = mainContainerRef.current;
         if (!elem) return;

         if (!document.fullscreenElement) {
           elem.requestFullscreen().catch(err => {
             alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
           });
           setIsFullScreen(true);
         } else {
           if (document.exitFullscreen) {
             document.exitFullscreen();
             setIsFullScreen(false);
           }
         }
    };

     useEffect(() => {
       const handleFullscreenChange = () => {
         setIsFullScreen(!!document.fullscreenElement);
       };
       document.addEventListener('fullscreenchange', handleFullscreenChange);
       return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
     }, []);


    return (
        <div ref={mainContainerRef} className={`flex flex-col h-screen bg-gray-950 text-gray-100 ${isFullScreen ? 'bg-gray-950' : ''}`}>
            {/* Header Section */}
            {!isFullScreen && (
                 <header className="p-4 border-b border-gray-800">
                    <div className="container mx-auto flex flex-wrap items-center justify-between gap-4">
                         <h1 className="text-2xl font-bold flex items-center gap-2">
                           {/* <Zap className="h-6 w-6 text-emerald-400" /> Replaced */}
                           UFind
                        </h1>
                        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-grow md:flex-grow-0">
                            <Input
                                type="text"
                                placeholder="@username or username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-emerald-500 focus:border-emerald-500 w-full md:w-64"
                                required
                            />
                             <div className="flex items-center gap-2">
                                 <Label htmlFor="depth-select" className="text-sm text-gray-400 whitespace-nowrap">Depth:</Label>
                                 <Select
                                     value={String(depth)}
                                     onValueChange={(value) => setDepth(Number(value))}
                                 >
                                     <SelectTrigger id="depth-select" className="w-[70px] bg-gray-800 border-gray-700 h-10">
                                         <SelectValue placeholder="Depth" />
                                     </SelectTrigger>
                                     <SelectContent>
                                         <SelectItem value="1">1</SelectItem>
                                         <SelectItem value="2">2</SelectItem>
                                         <SelectItem value="3">3</SelectItem>
                                     </SelectContent>
                                 </Select>
                             </div>
                            <Button type="submit" variant="secondary" disabled={isLoading}>
                                {isLoading ? "Loading..." : <Search className="h-4 w-4 mr-2" />}
                                Search
                            </Button>
                        </form>
                    </div>
                 </header>
            )}

             {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* Graph Area */}
                <div className={`flex-1 relative ${isSidebarOpen ? 'w-3/4' : 'w-full'} transition-all duration-300 ease-in-out`}>
                    {isLoading && (
                         <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 z-10">
                             <div className="text-center">
                                 <Loader2 className="h-12 w-12 animate-spin text-emerald-400 mx-auto mb-4" />
                                 <p className="text-lg font-medium">Loading graph data...</p>
                                 <p className="text-sm text-gray-400">Fetching connections for @{username}</p>
                             </div>
                         </div>
                    )}
                    {error && !isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10">
                            <Card className="w-full max-w-md bg-gray-800 border-red-500/50">
                                <CardHeader>
                                    <CardTitle className="text-red-400 flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5" /> Error Fetching Data
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-300">{error}</p>
                                    {usingSampleData && <p className="text-sm text-amber-400 mt-2">Displaying sample data instead.</p>}
                                     <p className="text-xs text-gray-500 mt-4">
                                         This could be due to Twitter API limits, an invalid username, or network issues.
                                         Please check the username and try again later. Deeper searches (Depth > 1) are more likely to hit rate limits.
                                     </p>
                                </CardContent>
                                 <CardFooter>
                                      <Button variant="secondary" onClick={() => setError(null)}>Dismiss</Button>
                                 </CardFooter>
                            </Card>
                        </div>
                    )}
                    {!isLoading && graphData && graphData.nodes.length > 0 && (
                         <>
                            <ForceGraph
                                data={graphData}
                                layout={layout}
                                nodeSizeMetric={nodeSizeMetric}
                                nodeColorScheme={nodeColorScheme}
                                onNodeClick={handleNodeClick}
                            />
                             {/* Controls Overlay */}
                            <div className={`absolute top-2 left-2 bg-gray-900/70 p-3 rounded-lg backdrop-blur-sm shadow-lg transition-opacity duration-300 ${isFullScreen ? 'opacity-30 hover:opacity-100' : ''}`}>
                                 <VisualizationControls
                                     layout={layout}
                                     nodeSizeMetric={nodeSizeMetric}
                                     nodeColorScheme={nodeColorScheme}
                                     onLayoutChange={setLayout}
                                     onNodeSizeMetricChange={setNodeSizeMetric}
                                     onNodeColorSchemeChange={setNodeColorScheme}
                                 />
                            </div>
                         </>
                    )}
                    {!isLoading && !graphData && !error && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center p-8 border border-dashed border-gray-700 rounded-lg">
                                 <Zap className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                                <h2 className="text-xl font-semibold text-gray-400">Welcome to UFind</h2> {/* Replaced */}
                                <p className="text-gray-500 mt-2">
                                    Enter a Twitter/X username and select a search depth <br /> to visualize their social network connections.
                                </p>
                            </div>
                        </div>
                    )}
                    {/* Fullscreen Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleFullScreen}
                        className={`absolute top-2 right-2 text-gray-400 hover:text-white bg-gray-900/50 hover:bg-gray-800/70 transition-opacity duration-300 ${isFullScreen ? 'opacity-30 hover:opacity-100' : ''}`}
                        title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                     >
                        {isFullScreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                    </Button>
                </div>

                {/* Sidebar */}
                <aside className={`bg-gray-900 border-l border-gray-800 transition-all duration-300 ease-in-out overflow-y-auto ${isSidebarOpen ? 'w-1/4 min-w-[350px] p-4' : 'w-0 p-0 overflow-hidden'}`}>
                    {isSidebarOpen && selectedNode && (
                        <div>
                            <Button variant="ghost" size="sm" onClick={() => setIsSidebarOpen(false)} className="mb-4 float-right">Close</Button>
                            <div className="flex items-center gap-4 mb-4">
                                <Avatar className={`h-16 w-16 border-2 ${getBorderColorForGroup(selectedNode.group)}`}>
                                    <AvatarImage src={selectedNode.imageUrl} alt={selectedNode.name} />
                                    <AvatarFallback className={`${getBackgroundColorForGroup(selectedNode.group)} ${getTextColorForGroup(selectedNode.group)} text-xl`}>
                                        {getInitials(selectedNode.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-lg font-bold">{selectedNode.name}</h3>
                                    <Link href={`https://twitter.com/${selectedNode.username}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline">
                                        @{selectedNode.username}
                                    </Link>
                                    <div className="flex items-center gap-2 mt-1">
                                         <Badge variant="secondary" className={`${getBackgroundColorForGroup(selectedNode.group)} ${getTextColorForGroup(selectedNode.group)} border-none`}>
                                            {capitalizeFirstLetter(selectedNode.group)}
                                        </Badge>
                                         <span className="text-xs text-gray-400 flex items-center gap-1" title="Followers">
                                             <Users className="h-3 w-3" /> {formatNumber(selectedNode.followers)}
                                         </span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm text-gray-400 mb-4">{selectedNode.description || "No description available."}</p>

                            <h4 className="font-semibold mb-2 text-gray-300 border-b border-gray-700 pb-1">Connections ({selectedNodeConnections?.length ?? 0})</h4>
                            <ScrollArea className="h-[calc(100vh-300px)] pr-2"> {/* Adjust height as needed */}
                                {selectedNodeConnections && selectedNodeConnections.length > 0 ? (
                                    <ul className="space-y-3">
                                        {selectedNodeConnections.map((link, index) => {
                                            const connectedNode = getConnectedNode(link);
                                            if (!connectedNode) return null; // Skip if connected node not found
                                            const isSource = link.source === selectedNode.id;
                                            return (
                                                <li key={`${link.source}-${link.target}-${link.type}-${index}`} className="flex items-center gap-3 p-2 rounded hover:bg-gray-800">
                                                    <Avatar className={`h-8 w-8 border ${getBorderColorForGroup(connectedNode.group)}`}>
                                                        <AvatarImage src={connectedNode.imageUrl} alt={connectedNode.name} />
                                                        <AvatarFallback className={`${getBackgroundColorForGroup(connectedNode.group)} ${getTextColorForGroup(connectedNode.group)} text-xs`}>
                                                             {getInitials(connectedNode.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 overflow-hidden">
                                                        <div className="text-sm font-medium truncate">{connectedNode.name}</div>
                                                         <Link href={`https://twitter.com/${connectedNode.username}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline truncate block">
                                                            @{connectedNode.username}
                                                        </Link>
                                                    </div>
                                                    <TooltipProvider delayDuration={100}>
                                                        <Tooltip>
                                                            <TooltipTrigger>
                                                                <Badge variant="outline" className={`text-xs ${getConnectionTypeBadgeClass(link.type)}`}>
                                                                     {isSource ? '→' : '←'} {getConnectionTypeLabel(link.type)} {link.count && link.count > 1 ? `(${link.count})` : ''}
                                                                </Badge>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>{isSource ? `${selectedNode.username} ${link.type} ${connectedNode.username}` : `${connectedNode.username} ${link.type} ${selectedNode.username}`}</p>
                                                                 {link.timestamp && <p className="text-xs text-gray-400">Last: {new Date(link.timestamp).toLocaleDateString()}</p>}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-gray-500">No connections to display for this node in the current graph.</p>
                                )}
                            </ScrollArea>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    )
}


// Helper functions (keep them or ensure they are imported correctly)
// ... (getBorderColorForGroup, getBackgroundColorForGroup, getTextColorForGroup, getConnectionTypeLabel, getConnectionTypeBadgeClass, getInitials, formatNumber, capitalizeFirstLetter) ...

// Example implementations if not imported:
function getConnectionTypeLabel(type: ConnectionType): string {
    switch (type) {
        case "follows": return "Follows";
        case "mentioned": return "Mentioned";
        case "retweeted": return "Retweeted";
        case "quoted": return "Quoted";
        case "replied": return "Replied";
        default: return capitalizeFirstLetter(type);
    }
}

function getConnectionTypeBadgeClass(type: ConnectionType): string {
     switch (type) {
         case "follows": return "border-blue-500/50 text-blue-400";
         case "mentioned": return "border-purple-500/50 text-purple-400";
         case "retweeted": return "border-green-500/50 text-green-400";
         case "quoted": return "border-yellow-500/50 text-yellow-400";
         case "replied": return "border-orange-500/50 text-orange-400";
         default: return "border-gray-500/50 text-gray-400";
     }
}

// Keep other helpers like getInitials, formatNumber, getBorderColorForGroup etc.
// Ensure they are either defined here or imported from lib/ui-helpers.ts

