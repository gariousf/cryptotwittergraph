"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Network, CircleOff, CircleDot, GitBranchPlus, Users, BarChart, Maximize, Palette } from "lucide-react"
import type { LayoutType, NodeSizeMetric, NodeColorScheme } from "./force-graph"

interface VisualizationControlsProps {
  layout: LayoutType
  nodeSizeMetric: NodeSizeMetric
  nodeColorScheme: NodeColorScheme
  onLayoutChange: (layout: LayoutType) => void
  onNodeSizeMetricChange: (metric: NodeSizeMetric) => void
  onNodeColorSchemeChange: (scheme: NodeColorScheme) => void
}

export function VisualizationControls({
  layout,
  nodeSizeMetric,
  nodeColorScheme,
  onLayoutChange,
  onNodeSizeMetricChange,
  onNodeColorSchemeChange,
}: VisualizationControlsProps) {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="px-4 py-3">
        <CardTitle>Visualization Controls</CardTitle>
        <CardDescription className="text-gray-400">Customize the graph visualization</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="layout">
          <TabsList className="grid grid-cols-3 bg-gray-800">
            <TabsTrigger value="layout" className="flex items-center gap-1">
              <Network className="h-4 w-4" />
              <span className="hidden sm:inline">Layout</span>
            </TabsTrigger>
            <TabsTrigger value="size" className="flex items-center gap-1">
              <Maximize className="h-4 w-4" />
              <span className="hidden sm:inline">Size</span>
            </TabsTrigger>
            <TabsTrigger value="color" className="flex items-center gap-1">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Color</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="layout" className="p-4">
            <RadioGroup
              value={layout}
              onValueChange={(value) => onLayoutChange(value as LayoutType)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="force" id="layout-force" />
                <Label htmlFor="layout-force" className="flex items-center gap-2 cursor-pointer">
                  <Network className="h-4 w-4 text-blue-400" />
                  <span>Force-Directed</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="radial" id="layout-radial" />
                <Label htmlFor="layout-radial" className="flex items-center gap-2 cursor-pointer">
                  <CircleDot className="h-4 w-4 text-emerald-400" />
                  <span>Radial</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="circular" id="layout-circular" />
                <Label htmlFor="layout-circular" className="flex items-center gap-2 cursor-pointer">
                  <CircleOff className="h-4 w-4 text-amber-400" />
                  <span>Circular (by group)</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hierarchical" id="layout-hierarchical" />
                <Label htmlFor="layout-hierarchical" className="flex items-center gap-2 cursor-pointer">
                  <GitBranchPlus className="h-4 w-4 text-purple-400" />
                  <span>Hierarchical</span>
                </Label>
              </div>
            </RadioGroup>

            <div className="mt-4 text-xs text-gray-500">
              <p>Different layouts highlight different aspects of the network structure.</p>
            </div>
          </TabsContent>

          <TabsContent value="size" className="p-4">
            <RadioGroup
              value={nodeSizeMetric}
              onValueChange={(value) => onNodeSizeMetricChange(value as NodeSizeMetric)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="followers" id="size-followers" />
                <Label htmlFor="size-followers" className="flex items-center gap-2 cursor-pointer">
                  <Users className="h-4 w-4 text-blue-400" />
                  <span>Followers Count</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="degreeCentrality" id="size-degree" />
                <Label htmlFor="size-degree" className="flex items-center gap-2 cursor-pointer">
                  <Network className="h-4 w-4 text-emerald-400" />
                  <span>Connection Count</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="betweennessCentrality" id="size-betweenness" />
                <Label htmlFor="size-betweenness" className="flex items-center gap-2 cursor-pointer">
                  <GitBranchPlus className="h-4 w-4 text-amber-400" />
                  <span>Betweenness Centrality</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="engagement" id="size-engagement" />
                <Label htmlFor="size-engagement" className="flex items-center gap-2 cursor-pointer">
                  <BarChart className="h-4 w-4 text-purple-400" />
                  <span>Engagement Score</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="uniform" id="size-uniform" />
                <Label htmlFor="size-uniform" className="flex items-center gap-2 cursor-pointer">
                  <CircleDot className="h-4 w-4 text-gray-400" />
                  <span>Uniform Size</span>
                </Label>
              </div>
            </RadioGroup>

            <div className="mt-4 text-xs text-gray-500">
              <p>Node size reflects the selected importance metric.</p>
            </div>
          </TabsContent>

          <TabsContent value="color" className="p-4">
            <RadioGroup
              value={nodeColorScheme}
              onValueChange={(value) => onNodeColorSchemeChange(value as NodeColorScheme)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="group" id="color-group" />
                <Label htmlFor="color-group" className="flex items-center gap-2 cursor-pointer">
                  <Users className="h-4 w-4 text-blue-400" />
                  <span>By Account Type</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="community" id="color-community" />
                <Label htmlFor="color-community" className="flex items-center gap-2 cursor-pointer">
                  <Network className="h-4 w-4 text-emerald-400" />
                  <span>By Community</span>
                </Label>
              </div>
            </RadioGroup>

            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Node Types</h4>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border-rose-500/20"
                >
                  Seed
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20"
                >
                  Influencers
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-blue-500/20"
                >
                  Projects
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border-purple-500/20"
                >
                  DAOs
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border-amber-500/20"
                >
                  Investors
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border-cyan-500/20"
                >
                  KOLs
                </Badge>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

