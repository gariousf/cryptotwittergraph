"use client"

import { useEffect, useRef } from "react"
import * as d3 from "d3"
import { getSentimentColor } from "@/lib/sentiment-service"

interface WordCloudProps {
  words: Array<{
    text: string
    value: number
    sentiment: "positive" | "negative" | "neutral"
  }>
  width?: number
  height?: number
}

export function WordCloud({ words, width = 500, height = 300 }: WordCloudProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || words.length === 0) return

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove()

    // Create a simple word cloud without d3-cloud
    // This is a simplified version since d3-cloud might cause issues
    const svg = d3.select(svgRef.current)
    const g = svg.append("g").attr("transform", `translate(${width / 2}, ${height / 2})`)

    // Calculate positions in a circular layout
    const angleStep = (2 * Math.PI) / words.length
    const radius = Math.min(width, height) / 3

    words.forEach((word, i) => {
      const angle = i * angleStep
      const x = radius * Math.cos(angle) * (0.5 + Math.random() * 0.5)
      const y = radius * Math.sin(angle) * (0.5 + Math.random() * 0.5)
      const fontSize = 10 + word.value * 3

      g.append("text")
        .attr("x", x)
        .attr("y", y)
        .attr("text-anchor", "middle")
        .attr("font-size", `${fontSize}px`)
        .attr("fill", () => {
          if (word.sentiment === "positive") return getSentimentColor("positive")
          if (word.sentiment === "negative") return getSentimentColor("negative")
          return "#6b7280" // gray-500 for neutral
        })
        .text(word.text)
    })
  }, [words, width, height])

  return <svg ref={svgRef} width={width} height={height} className="mx-auto" />
}

