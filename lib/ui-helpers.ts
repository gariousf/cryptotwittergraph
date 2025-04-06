// Helper functions for styling
export function getBorderColorForGroup(group: string): string {
  switch (group) {
    case "seed":
      return "border-rose-500/50"
    case "influencer":
      return "border-emerald-500/50"
    case "project":
      return "border-blue-500/50"
    case "dao":
      return "border-purple-500/50"
    case "investor":
      return "border-amber-500/50"
    case "company":
      return "border-indigo-500/50"
    case "kol":
      return "border-cyan-500/50"
    default:
      return "border-gray-500/50"
  }
}

export function getBackgroundColorForGroup(group: string): string {
  switch (group) {
    case "seed":
      return "bg-rose-500/20"
    case "influencer":
      return "bg-emerald-500/20"
    case "project":
      return "bg-blue-500/20"
    case "dao":
      return "bg-purple-500/20"
    case "investor":
      return "bg-amber-500/20"
    case "company":
      return "bg-indigo-500/20"
    case "kol":
      return "bg-cyan-500/20"
    default:
      return "bg-gray-500/20"
  }
}

export function getTextColorForGroup(group: string): string {
  switch (group) {
    case "seed":
      return "text-rose-400"
    case "influencer":
      return "text-emerald-400"
    case "project":
      return "text-blue-400"
    case "dao":
      return "text-purple-400"
    case "investor":
      return "text-amber-400"
    case "company":
      return "text-indigo-400"
    case "kol":
      return "text-cyan-400"
    default:
      return "text-gray-400"
  }
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M"
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K"
  }
  return num.toString()
}

export function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

