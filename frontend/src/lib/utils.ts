import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(address: string): string {
  if (!address) return ""
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatBalance(balance: bigint | undefined, decimals: number = 18): string {
  if (!balance) return "0"
  const divisor = BigInt(10 ** decimals)
  const whole = balance / divisor
  const fraction = balance % divisor
  const fractionStr = fraction.toString().padStart(decimals, '0').slice(0, 4)
  return `${whole}.${fractionStr}`
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export function getSeverityColor(severity: string | undefined | null): string {
  if (!severity) return 'text-gray-500'
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'text-red-500'
    case 'high':
      return 'text-red-500'
    case 'medium':
      return 'text-yellow-500'
    case 'low':
      return 'text-blue-500'
    case 'info':
      return 'text-gray-500'
    default:
      return 'text-gray-500'
  }
}

export function getSeverityBgColor(severity: string | undefined | null): string {
  if (!severity) return 'bg-gray-500/10 border-gray-500/20'
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'bg-red-500/10 border-red-500/20'
    case 'high':
      return 'bg-red-500/10 border-red-500/20'
    case 'medium':
      return 'bg-yellow-500/10 border-yellow-500/20'
    case 'low':
      return 'bg-blue-500/10 border-blue-500/20'
    case 'info':
      return 'bg-gray-500/10 border-gray-500/20'
    default:
      return 'bg-gray-500/10 border-gray-500/20'
  }
}

export function getSeverityBorderColor(severity: string | undefined | null): string {
  if (!severity) return 'border-l-gray-500'
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'border-l-red-500'
    case 'high':
      return 'border-l-red-500'
    case 'medium':
      return 'border-l-yellow-500'
    case 'low':
      return 'border-l-blue-500'
    case 'info':
      return 'border-l-gray-500'
    default:
      return 'border-l-gray-500'
  }
}

export function getSeverityBadgeVariant(severity: string | undefined | null): 'destructive' | 'secondary' | 'outline' | 'default' {
  if (!severity) return 'default'
  switch (severity.toLowerCase()) {
    case 'critical':
    case 'high':
      return 'destructive'
    case 'medium':
      return 'secondary'
    case 'low':
      return 'outline'
    case 'info':
    default:
      return 'default'
  }
}

export function getSeverityIcon(severity: string | undefined | null): string {
  if (!severity) return 'Info'
  switch (severity.toLowerCase()) {
    case 'critical':
    case 'high':
      return 'AlertTriangle'
    case 'medium':
      return 'Shield'
    case 'low':
      return 'CheckCircle'
    case 'info':
    default:
      return 'Info'
  }
}

export function sortVulnerabilitiesBySeverity<T extends { severity: string | undefined | null }>(vulnerabilities: T[]): T[] {
  const severityOrder = { critical: 4, high: 3, medium: 2, low: 1, info: 0 }
  return vulnerabilities.sort((a, b) => {
    const aSeverity = a.severity?.toLowerCase() || 'info'
    const bSeverity = b.severity?.toLowerCase() || 'info'
    return (severityOrder[bSeverity as keyof typeof severityOrder] || 0) - 
           (severityOrder[aSeverity as keyof typeof severityOrder] || 0)
  })
} 