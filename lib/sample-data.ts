import type { GraphData, GraphNode, GraphLink } from "@/types/twitter"

// Sample crypto Twitter accounts
export const sampleUsers: GraphNode[] = [
  {
    id: "vitalik",
    name: "Vitalik Buterin",
    username: "VitalikButerin",
    group: "kol",
    followers: 2400000,
    description: "Ethereum co-founder. Interested in cryptography, economics, and decentralized systems.",
    kolRank: 98,
  },
  {
    id: "ethereum",
    name: "Ethereum",
    username: "ethereum",
    group: "project",
    followers: 3200000,
    description: "Ethereum is a global, open-source platform for decentralized applications.",
  },
  {
    id: "optimism",
    name: "Optimism",
    username: "optimismFND",
    group: "project",
    followers: 450000,
    description: "Optimism is a Layer 2 scaling solution for Ethereum.",
  },
  {
    id: "arbitrum",
    name: "Arbitrum",
    username: "arbitrum",
    group: "project",
    followers: 380000,
    description: "Arbitrum is a Layer 2 scaling solution for Ethereum.",
  },
  {
    id: "balaji",
    name: "Balaji Srinivasan",
    username: "balajis",
    group: "kol",
    followers: 780000,
    description:
      "Angel investor, entrepreneur, former CTO of Coinbase and General Partner at a16z. Crypto analyst and thought leader.",
    kolRank: 92,
  },
  {
    id: "a16z",
    name: "a16z",
    username: "a16z",
    group: "investor",
    followers: 950000,
    description:
      "Andreessen Horowitz (a16z) is a venture capital firm that backs bold entrepreneurs building the future.",
  },
  {
    id: "coinbase",
    name: "Coinbase",
    username: "coinbase",
    group: "company",
    followers: 1800000,
    description: "Coinbase is a secure platform that makes it easy to buy, sell, and store cryptocurrency.",
  },
  {
    id: "binance",
    name: "Binance",
    username: "binance",
    group: "company",
    followers: 2100000,
    description: "Binance is the world's leading blockchain ecosystem and cryptocurrency infrastructure provider.",
  },
  {
    id: "cz",
    name: "CZ",
    username: "cz_binance",
    group: "kol",
    followers: 1500000,
    description: "Founder & CEO of Binance. Crypto expert and industry leader.",
    kolRank: 95,
  },
  {
    id: "uniswap",
    name: "Uniswap",
    username: "Uniswap",
    group: "project",
    followers: 680000,
    description: "Uniswap is a decentralized protocol for automated liquidity provision on Ethereum.",
  },
  {
    id: "aave",
    name: "Aave",
    username: "AaveAave",
    group: "project",
    followers: 420000,
    description:
      "Aave is an open source and non-custodial liquidity protocol for earning interest on deposits and borrowing assets.",
  },
  {
    id: "polygon",
    name: "Polygon",
    username: "0xPolygon",
    group: "project",
    followers: 750000,
    description:
      "Polygon is a protocol and a framework for building and connecting Ethereum-compatible blockchain networks.",
  },
  {
    id: "cryptoKaleo",
    name: "Kaleo",
    username: "CryptoKaleo",
    group: "kol",
    followers: 560000,
    description: "Crypto analyst and trader. Sharing market insights and technical analysis for Bitcoin and altcoins.",
    kolRank: 88,
  },
  {
    id: "cryptoCred",
    name: "Cred",
    username: "CryptoCred",
    group: "kol",
    followers: 420000,
    description:
      "Crypto educator and technical analyst. Helping traders understand market dynamics and trading strategies.",
    kolRank: 85,
  },
  {
    id: "coinBureau",
    name: "Coin Bureau",
    username: "coinbureau",
    group: "kol",
    followers: 850000,
    description:
      "Independent crypto educator and researcher. Providing unbiased information on cryptocurrencies and blockchain technology.",
    kolRank: 90,
  },
  // Add Bitcoin node to fix the missing reference
  {
    id: "bitcoin",
    name: "Bitcoin",
    username: "bitcoin",
    group: "project",
    followers: 4500000,
    description:
      "Bitcoin is a decentralized digital currency that can be sent from user to user on the peer-to-peer bitcoin network.",
  },
]

// Sample connections between accounts with connection types
export const sampleLinks: GraphLink[] = [
  { source: "vitalik", target: "ethereum", value: 10, type: "follows" },
  { source: "vitalik", target: "optimism", value: 8, type: "follows" },
  { source: "vitalik", target: "balaji", value: 5, type: "follows" },
  { source: "ethereum", target: "optimism", value: 7, type: "follows" },
  { source: "ethereum", target: "arbitrum", value: 7, type: "follows" },
  { source: "ethereum", target: "uniswap", value: 8, type: "follows" },
  { source: "ethereum", target: "aave", value: 6, type: "follows" },
  { source: "balaji", target: "a16z", value: 9, type: "follows" },
  { source: "balaji", target: "coinbase", value: 7, type: "follows" },
  { source: "a16z", target: "coinbase", value: 8, type: "follows" },
  { source: "a16z", target: "uniswap", value: 6, type: "follows" },
  { source: "binance", target: "cz", value: 10, type: "follows" },
  { source: "polygon", target: "ethereum", value: 8, type: "follows" },
  { source: "polygon", target: "aave", value: 5, type: "follows" },
  { source: "aave", target: "uniswap", value: 6, type: "follows" },
  // New KOL connections
  { source: "cryptoKaleo", target: "coinBureau", value: 7, type: "follows" },
  { source: "cryptoKaleo", target: "cryptoCred", value: 6, type: "follows" },
  { source: "cryptoCred", target: "coinBureau", value: 8, type: "follows" },
  { source: "vitalik", target: "cryptoKaleo", value: 4, type: "follows" },
  { source: "balaji", target: "cryptoCred", value: 5, type: "follows" },
  { source: "cz", target: "coinBureau", value: 6, type: "follows" },
  { source: "coinBureau", target: "ethereum", value: 7, type: "follows" },
  { source: "cryptoCred", target: "uniswap", value: 5, type: "follows" },
  { source: "cryptoKaleo", target: "polygon", value: 4, type: "follows" },

  // Add different interaction types
  { source: "vitalik", target: "ethereum", value: 6, type: "mentioned", count: 12 },
  { source: "vitalik", target: "optimism", value: 4, type: "retweeted", count: 5 },
  { source: "balaji", target: "vitalik", value: 5, type: "mentioned", count: 8 },
  { source: "cz", target: "binance", value: 7, type: "mentioned", count: 15 },
  { source: "coinBureau", target: "ethereum", value: 5, type: "retweeted", count: 7 },
  { source: "cryptoKaleo", target: "bitcoin", value: 6, type: "mentioned", count: 10 },
  { source: "cryptoCred", target: "vitalik", value: 4, type: "quoted", count: 3 },
  { source: "ethereum", target: "polygon", value: 5, type: "mentioned", count: 6 },
  { source: "uniswap", target: "ethereum", value: 6, type: "mentioned", count: 9 },
  { source: "aave", target: "ethereum", value: 5, type: "retweeted", count: 8 },
]

// Get sample graph data for a specific user
export function getSampleGraphData(username: string): GraphData {
  // Find the user in our sample data
  const lowerUsername = username.toLowerCase()
  const seedUser = sampleUsers.find(
    (user) => user.username.toLowerCase() === lowerUsername || user.name.toLowerCase().includes(lowerUsername),
  )

  // If we don't have this specific user, default to Vitalik
  const seedId = seedUser?.id || "vitalik"

  // Mark the seed user with the 'seed' group
  const nodes = sampleUsers.map((user) => ({
    ...user,
    group: user.id === seedId ? "seed" : user.group,
  }))

  return {
    nodes,
    links: sampleLinks,
  }
}

