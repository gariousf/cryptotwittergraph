"use client"

import { useEffect, useRef } from "react"
import * as d3 from "d3"
import { getSentimentColor } from "@/lib/sentiment-utils"

interface EnhancedWordCloudProps {
  words: Array<{
    text: string
    value: number
    sentiment: "positive" | "negative" | "neutral"
  }>
  width?: number
  height?: number
  maxWords?: number
}

export function EnhancedWordCloud({ 
  words, 
  width = 500, 
  height = 300,
  maxWords = 100
}: EnhancedWordCloudProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || words.length === 0) return

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove()

    // Create SVG group
    const svg = d3.select(svgRef.current)
    const g = svg.append("g").attr("transform", `translate(${width / 2},${height / 2})`)

    // Sort words by value and limit to maxWords
    const sortedWords = [...words]
      .sort((a, b) => b.value - a.value)
      .slice(0, maxWords)

    // Scale for font size based on word frequency
    const fontSizeScale = d3.scaleLinear()
      .domain([
        d3.min(sortedWords, d => d.value) || 1, 
        d3.max(sortedWords, d => d.value) || 10
      ])
      .range([12, 40])

    // Place words in a spiral pattern
    sortedWords.forEach((word, i) => {
      const angle = (i % 180) * Math.PI / 90
      const radius = 10 + 5 * Math.sqrt(i)
      const x = radius * Math.cos(angle)
      const y = radius * Math.sin(angle)
      const fontSize = fontSizeScale(word.value)

      g.append("text")
        .attr("x", x)
        .attr("y", y)
        .attr("text-anchor", "middle")
        .attr("font-size", `${fontSize}px`)
        .attr("font-weight", word.value > (d3.mean(sortedWords, d => d.value) || 0) ? "bold" : "normal")
        .attr("fill", getSentimentColor(word.sentiment))
        .attr("opacity", 0.9)
        .text(word.text)
        .append("title")
        .text(`${word.text} (${word.value} occurrences)`)
    })
  }, [words, width, height, maxWords])

  return (
    <div className="relative">
      <svg ref={svgRef} width={width} height={height} className="mx-auto" />
      <div className="absolute bottom-2 right-2 flex gap-2 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: getSentimentColor("positive") }}></div>
          <span>Positive</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: getSentimentColor("neutral") }}></div>
          <span>Neutral</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: getSentimentColor("negative") }}></div>
          <span>Negative</span>
        </div>
      </div>
    </div>
  )
} 