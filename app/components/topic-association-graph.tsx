"use client"

import { useEffect, useRef } from "react"
import * as d3 from "d3"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Network } from "lucide-react"

interface TopicAssociationGraphProps {
  rules: Array<{
    antecedent: string[]
    consequent: string[]
    confidence: number
    lift: number
  }>
  width?: number
  height?: number
}

export function TopicAssociationGraph({ 
  rules, 
  width = 600, 
  height = 400 
}: TopicAssociationGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  
  useEffect(() => {
    if (!svgRef.current || rules.length === 0) return
    
    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove()
    
    // Extract nodes and links from rules
    const nodes = new Map<string, { id: string, group: number, count: number }>()
    const links: Array<{ source: string, target: string, value: number }> = []
    
    // Process rules to create graph data
    rules.forEach(rule => {
      // Add antecedent nodes
      rule.antecedent.forEach(item => {
        if (!nodes.has(item)) {
          nodes.set(item, { id: item, group: 1, count: 0 })
        }
        const node = nodes.get(item)!
        node.count++
      })
      
      // Add consequent nodes
      rule.consequent.forEach(item => {
        if (!nodes.has(item)) {
          nodes.set(item, { id: item, group: 2, count: 0 })
        }
        const node = nodes.get(item)!
        node.count++
        
        // Add links from antecedents to consequents
        rule.antecedent.forEach(source => {
          links.push({
            source,
            target: item,
            value: rule.confidence
          })
        })
      })
    })
    
    // Create force simulation
    const simulation = d3.forceSimulation(Array.from(nodes.values()))
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30))
    
    // Create SVG elements
    const svg = d3.select(svgRef.current)
    
    // Add links
    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .enter().append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", d => Math.sqrt(d.value) * 2)
    
    // Add nodes
    const node = svg.append("g")
      .selectAll("g")
      .data(Array.from(nodes.values()))
      .enter().append("g")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
      )
    
    // Add circles for nodes
    node.append("circle")
      .attr("r", d => 10 + Math.sqrt(d.count) * 2)
      .attr("fill", d => d.group === 1 ? "#4f46e5" : "#10b981")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
    
    // Add labels
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .attr("fill", "#fff")
      .text(d => `#${d.id}`)
      .style("font-size", "10px")
    
    // Add title for hover
    node.append("title")
      .text(d => `#${d.id} (${d.count} occurrences)`)
    
    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as any).x)
        .attr("y1", d => (d.source as any).y)
        .attr("x2", d => (d.target as any).x)
        .attr("y2", d => (d.target as any).y)
      
      node
        .attr("transform", d => `translate(${d.x},${d.y})`)
    })
    
    // Drag functions
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      event.subject.fx = event.subject.x
      event.subject.fy = event.subject.y
    }
    
    function dragged(event: any) {
      event.subject.fx = event.x
      event.subject.fy = event.y
    }
    
    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0)
      event.subject.fx = null
      event.subject.fy = null
    }
    
    // Cleanup
    return () => {
      simulation.stop()
    }
  }, [rules, width, height])
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5 text-indigo-500" />
          Topic Association Graph
        </CardTitle>
        <CardDescription>
          Visualize relationships between hashtags
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rules.length > 0 ? (
          <div className="relative">
            <svg ref={svgRef} width={width} height={height} className="mx-auto" />
            <div className="absolute bottom-2 right-2 flex gap-2 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-1 bg-indigo-600"></div>
                <span>Antecedent</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-1 bg-emerald-600"></div>
                <span>Consequent</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center h-[400px] text-gray-500">
            No association rules available
          </div>
        )}
      </CardContent>
    </Card>
  )
} 