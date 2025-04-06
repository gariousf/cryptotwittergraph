"use server"

import { cache } from "react"

// Price data interface
export interface PriceData {
  symbol: string
  name: string
  prices: {
    timestamp: string
    price: number
    volume: number
    marketCap?: number
  }[]
}

// Price correlation result
export interface PriceCorrelation {
  symbol: string
  name: string
  correlation: number
  timeframe: string
  dataPoints: {
    date: string
    price: number
    sentiment: number
    activity: number
  }[]
}

// Cache price data to avoid redundant API calls
export const getCryptoPrice = cache(async (symbol: string, days = 30): Promise<PriceData | null> => {
  try {
    // In a real implementation, you would use a cryptocurrency API
    // For example: CoinGecko, CryptoCompare, etc.
    // Here we'll use a mock implementation

    // For demo purposes, we'll generate mock data
    const prices = generateMockPriceData(symbol, days)

    return {
      symbol: symbol.toUpperCase(),
      name: getTokenName(symbol),
      prices,
    }
  } catch (error) {
    console.error(`Error fetching price data for ${symbol}:`, error)
    return null
  }
})

// Get multiple crypto prices
export const getMultipleCryptoPrices = cache(
  async (symbols: string[], days = 30): Promise<Record<string, PriceData>> => {
    const results: Record<string, PriceData> = {}

    await Promise.all(
      symbols.map(async (symbol) => {
        const data = await getCryptoPrice(symbol, days)
        if (data) {
          results[symbol.toLowerCase()] = data
        }
      }),
    )

    return results
  },
)

// Calculate correlation between sentiment and price
export async function calculatePriceCorrelation(
  priceData: PriceData,
  sentimentData: { timestamp: string; score: number; activity: number }[],
): Promise<PriceCorrelation> {
  // Map sentiment data to price data timestamps
  const correlationData: PriceCorrelation["dataPoints"] = []

  // Create a map of timestamps to sentiment data for quick lookup
  const sentimentMap = new Map(
    sentimentData.map((item) => [new Date(item.timestamp).toISOString().split("T")[0], item]),
  )

  // For each price data point, find the corresponding sentiment data
  priceData.prices.forEach((pricePoint) => {
    const dateStr = new Date(pricePoint.timestamp).toISOString().split("T")[0]
    const sentimentPoint = sentimentMap.get(dateStr)

    if (sentimentPoint) {
      correlationData.push({
        date: dateStr,
        price: pricePoint.price,
        sentiment: sentimentPoint.score,
        activity: sentimentPoint.activity,
      })
    }
  })

  // Calculate correlation coefficient
  const correlation = calculateCorrelationCoefficient(
    correlationData.map((d) => d.price),
    correlationData.map((d) => d.sentiment),
  )

  return {
    symbol: priceData.symbol,
    name: priceData.name,
    correlation,
    timeframe: `${correlationData.length} days`,
    dataPoints: correlationData,
  }
}

// Helper function to calculate Pearson correlation coefficient
function calculateCorrelationCoefficient(x: number[], y: number[]): number {
  // Need at least 2 data points to calculate correlation
  if (x.length < 2 || y.length < 2 || x.length !== y.length) {
    return 0
  }

  // Calculate means
  const xMean = x.reduce((sum, val) => sum + val, 0) / x.length
  const yMean = y.reduce((sum, val) => sum + val, 0) / y.length

  // Calculate covariance and variances
  let covariance = 0
  let xVariance = 0
  let yVariance = 0

  for (let i = 0; i < x.length; i++) {
    const xDiff = x[i] - xMean
    const yDiff = y[i] - yMean
    covariance += xDiff * yDiff
    xVariance += xDiff * xDiff
    yVariance += yDiff * yDiff
  }

  // Avoid division by zero
  if (xVariance === 0 || yVariance === 0) {
    return 0
  }

  // Calculate correlation coefficient
  return covariance / Math.sqrt(xVariance * yVariance)
}

// Generate mock price data
function generateMockPriceData(symbol: string, days: number) {
  const now = new Date()
  const prices = []
  let basePrice = getBasePrice(symbol)
  let volatility = getVolatility(symbol)

  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    // Add some randomness to the price
    const randomChange = (Math.random() - 0.5) * volatility * basePrice
    basePrice = Math.max(0.01, basePrice + randomChange)

    // Add some trend based on the symbol
    if (symbol.toLowerCase() === "btc" || symbol.toLowerCase() === "eth") {
      // Upward trend for BTC and ETH
      basePrice *= 1.005
    } else if (["sol", "avax", "matic"].includes(symbol.toLowerCase())) {
      // Slight upward trend for SOL, AVAX, MATIC
      basePrice *= 1.003
    }

    // Add volume data
    const volume = Math.round(basePrice * 1000000 * (0.5 + Math.random()))

    prices.push({
      timestamp: date.toISOString(),
      price: parseFloat(basePrice.toFixed(2)),
      volume,
      marketCap: parseFloat((basePrice * getCirculatingSupply(symbol)).toFixed(0)),
    })
  }

  return prices
}

// Helper function to get base price for a token
function getBasePrice(symbol: string): number {
  const symbolLower = symbol.toLowerCase()
  switch (symbolLower) {
    case "btc":
      return 30000 + Math.random() * 5000
    case "eth":
      return 1800 + Math.random() * 300
    case "bnb":
      return 220 + Math.random() * 30
    case "sol":
      return 20 + Math.random() * 5
    case "ada":
      return 0.3 + Math.random() * 0.1
    case "xrp":
      return 0.5 + Math.random() * 0.1
    case "dot":
      return 5 + Math.random() * 1
    case "doge":
      return 0.07 + Math.random() * 0.02
    case "avax":
      return 10 + Math.random() * 2
    case "matic":
      return 0.6 + Math.random() * 0.1
    default:
      return 1 + Math.random() * 10
  }
}

// Helper function to get volatility for a token
function getVolatility(symbol: string): number {
  const symbolLower = symbol.toLowerCase()
  switch (symbolLower) {
    case "btc":
      return 0.03
    case "eth":
      return 0.04
    case "bnb":
      return 0.05
    case "sol":
      return 0.08
    case "doge":
      return 0.1
    default:
      return 0.06
  }
}

// Helper function to get circulating supply for a token
function getCirculatingSupply(symbol: string): number {
  const symbolLower = symbol.toLowerCase()
  switch (symbolLower) {
    case "btc":
      return 19000000
    case "eth":
      return 120000000
    case "bnb":
      return 155000000
    case "sol":
      return 400000000
    case "ada":
      return 35000000000
    case "xrp":
      return 50000000000
    case "dot":
      return 1200000000
    case "doge":
      return 140000000000
    case "avax":
      return 350000000
    case "matic":
      return 9000000000
    default:
      return 1000000000
  }
}

// Helper function to get token name
function getTokenName(symbol: string): string {
  const symbolLower = symbol.toLowerCase()
  switch (symbolLower) {
    case "btc":
      return "Bitcoin"
    case "eth":
      return "Ethereum"
    case "bnb":
      return "Binance Coin"
    case "sol":
      return "Solana"
    case "ada":
      return "Cardano"
    case "xrp":
      return "XRP"
    case "dot":
      return "Polkadot"
    case "doge":
      return "Dogecoin"
    case "avax":
      return "Avalanche"
    case "matic":
      return "Polygon"
    default:
      return symbol.toUpperCase()
  }
}

// Map Twitter usernames to likely crypto tokens
export async function mapUsernameToCryptoSymbols(username: string): Promise<string[]> {
  const usernameLower = username.toLowerCase()

  // Map known crypto accounts to their tokens
  const cryptoMap: Record<string, string[]> = {
    vitalikbuterin: ["eth"],
    ethereum: ["eth"],
    solana: ["sol"],
    binance: ["bnb"],
    cz_binance: ["bnb"],
    ripple: ["xrp"],
    cardano: ["ada"],
    dogecoin: ["doge"],
    polkadot: ["dot"],
    avalancheavax: ["avax"],
    maticnetwork: ["matic"],
    polygon: ["matic"],
    saylor: ["btc"],
    bitcoinmagazine: ["btc"],
    coinbase: ["btc", "eth"],
    kraken: ["btc", "eth"],
    ftx: ["btc", "eth", "sol"],
    bitfinex: ["btc", "eth"],
    gemini: ["btc", "eth"],
    grayscale: ["btc", "eth"],
    microstrategy: ["btc"],
  }

  // Return mapped tokens or default to BTC and ETH
  return cryptoMap[usernameLower] || ["btc", "eth"]
}

