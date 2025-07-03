import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(address: string): string {
  if (!address) return ""
  return `${address.slice(0, 6)}...${address.slice(-4)}`
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

export function getSeverityColor(severity: string): string {
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

export function getSeverityBgColor(severity: string): string {
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

export function getSeverityBorderColor(severity: string): string {
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

export function getSeverityBadgeVariant(severity: string): 'destructive' | 'secondary' | 'outline' | 'default' {
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

export function getSeverityIcon(severity: string): string {
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

export function sortVulnerabilitiesBySeverity<T extends { severity: string }>(vulnerabilities: T[]): T[] {
  const severityOrder = { critical: 4, high: 3, medium: 2, low: 1, info: 0 }
  return vulnerabilities.sort((a, b) => {
    return (severityOrder[b.severity.toLowerCase() as keyof typeof severityOrder] || 0) - 
           (severityOrder[a.severity.toLowerCase() as keyof typeof severityOrder] || 0)
  })
} 