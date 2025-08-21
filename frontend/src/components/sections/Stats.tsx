"use client"

import { Card, CardContent } from '@/components/ui/card'
import { useEffect, useState } from 'react'
import { apiService } from '@/lib/api'

interface GlobalStats {
  totalScans: string
  totalVulnerabilities: string
  detectionAccuracy: string
  completedScans: number
  failedScans: number
  highVulnerabilities: number
  mediumVulnerabilities: number
  lowVulnerabilities: number
}

export function Stats() {
  const [stats, setStats] = useState<GlobalStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const data = await apiService.getGlobalStats()
        setStats(data)
      } catch (err) {
        console.error('Failed to fetch global stats:', err)
        setError('Failed to load statistics')
        // Fallback to default stats if API fails
        setStats({
          totalScans: '0',
          totalVulnerabilities: '0',
          detectionAccuracy: '0.0%',
          completedScans: 0,
          failedScans: 0,
          highVulnerabilities: 0,
          mediumVulnerabilities: 0,
          lowVulnerabilities: 0
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <section className="bg-background py-12 sm:py-16 md:py-32">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:max-w-5xl">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-3 sm:mb-4">Trusted by Developers Worldwide</h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-4">
              Loading platform statistics...
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <StatCard
              number="..."
              label="Smart Contracts Scanned"
              description="Loading..."
            />
            <StatCard
              number="..."
              label="Vulnerabilities Detected"
              description="Loading..."
            />
            <StatCard
              number="..."
              label="Detection Accuracy"
              description="Loading..."
            />
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-background py-12 sm:py-16 md:py-32">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:max-w-5xl">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-3 sm:mb-4">Trusted by Developers Worldwide</h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-4">
            Our platform has processed millions of smart contracts, helping secure the future of decentralized applications.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <StatCard
            number={stats?.totalScans || '0'}
            label="Smart Contracts Scanned"
            description="Advanced AI analysis across multiple blockchain networks"
          />
          <StatCard
            number={stats?.totalVulnerabilities || '0'}
            label="Vulnerabilities Detected"
            description="Critical security issues identified and prevented"
          />
          <StatCard
            number={stats?.detectionAccuracy || '0.0%'}
            label="Detection Accuracy"
            description="Industry-leading precision in vulnerability detection"
          />
        </div>
      </div>
    </section>
  )
}

interface StatCardProps {
  number: string
  label: string
  description: string
}

const StatCard = ({ number, label, description }: StatCardProps) => (
  <Card className="group relative rounded-none shadow-zinc-950/5 bg-black/50 dark:bg-black/50 border border-white/10 hover:border-primary/30 transition-all duration-300">
    <CardDecorator />
    <CardContent className="p-4 sm:p-6 text-center">
      <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-2 group-hover:text-primary/80 transition-colors">
        {number}
      </div>
      <div className="text-base sm:text-lg font-medium mb-2 sm:mb-3">{label}</div>
      <div className="text-xs sm:text-sm text-muted-foreground">{description}</div>
      <div className="mt-3 sm:mt-4 h-1 bg-gradient-to-r from-primary/40 to-primary/20 rounded-full"></div>
    </CardContent>
  </Card>
)

const CardDecorator = () => (
  <>
    <span className="border-primary absolute -left-px -top-px block size-2 border-l-2 border-t-2"></span>
    <span className="border-primary absolute -right-px -top-px block size-2 border-r-2 border-t-2"></span>
    <span className="border-primary absolute -bottom-px -left-px block size-2 border-b-2 border-l-2"></span>
    <span className="border-primary absolute -bottom-px -right-px block size-2 border-b-2 border-r-2"></span>
  </>
) 