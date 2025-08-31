'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { 
  Shield, 
  Globe, 
  BarChart3, 
  Activity, 
  Target, 
  TrendingUp as TrendingUpIcon,
  Rocket, 
  Clock, 
  CheckCircle2, 
  Award, 
  Search, 
  DollarSign, 
  Calendar,
  Trophy,
  FileText,
  Settings,
  Bell,
  Lock,
  Unlock,
  Users,
  Zap,
  Flame,
  Crown,
  Medal
} from 'lucide-react'

interface BlockNetSidebarProps {
  activeSection?: string
  activeSubSection?: string
  onSectionChange?: (section: string) => void
  onSubSectionChange?: (subSection: string) => void
  showBackButton?: boolean
  onBackClick?: () => void
}

export default function BlockNetSidebar({
  activeSection = 'discovery',
  activeSubSection = 'trending',
  onSectionChange,
  onSubSectionChange,
  showBackButton = false,
  onBackClick
}: BlockNetSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const router = useRouter()

  const handleSectionClick = (section: string) => {
    if (onSectionChange) {
      onSectionChange(section)
    }
  }

  const handleSubSectionClick = (subSection: string) => {
    if (onSubSectionChange) {
      onSubSectionChange(subSection)
    }
  }

     const handleBrandingClick = () => {
     router.push('/blocknet')
   }

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-48'} bg-[#111213] border-r border-gray-800 flex flex-col h-full overflow-y-auto transition-all duration-300`}>
      {/* Branding */}
      <div className="px-4 pt-4 pb-2 border-b border-gray-800">
                 <button
           onClick={handleBrandingClick}
           className="w-full flex items-center gap-3 rounded-lg p-2"
         >
           <Image
             src="/logo.png"
             alt="BlitzProof Logo"
             width={32}
             height={32}
             className="rounded object-cover flex-shrink-0"
           />
           {!isCollapsed && (
             <div>
               <h1 className="text-lg font-bold text-white">BlitzProof</h1>
                              <div className="flex items-center gap-2">
                 <div className="w-9 h-px bg-white"></div>
                 <p className="text-[10px] text-white leading-tight">BlockNet</p>
               </div>
             </div>
           )}
         </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 space-y-6">
        {/* Discovery Section */}
        <div>
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Discovery</h3>
          )}
          <div className="space-y-1">
            {[
              { id: 'discovery', label: 'Discovery', icon: Globe, active: activeSection === 'discovery' },
              { id: 'terminal', label: 'Terminal', icon: BarChart3, active: activeSection === 'terminal' },
              { id: 'pulse', label: 'Pulse', icon: Activity, active: activeSection === 'pulse' },
              { id: 'quest', label: 'Quest', icon: Target, active: activeSection === 'quest' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleSectionClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  item.active
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && <span className="text-left">{item.label}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboards Section */}
        <div>
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Leaderboards</h3>
          )}
          <div className="space-y-1">
            {[
              { id: 'trending', label: 'Trending', icon: TrendingUpIcon, active: activeSubSection === 'trending' },
              { id: 'new-launch', label: 'New Launch', icon: Rocket, active: activeSubSection === 'new-launch' },
              { id: 'pre-launch', label: 'Pre Launch', icon: Clock, active: activeSubSection === 'pre-launch' },
              { id: 'team-verified', label: 'Team Verified', icon: CheckCircle2, active: activeSubSection === 'team-verified' },
              { id: 'exchange', label: 'Exchange', icon: Award, active: activeSubSection === 'exchange' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleSubSectionClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  item.active
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && <span className="text-left">{item.label}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Tools Section */}
        <div>
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Tools</h3>
          )}
          <div className="space-y-1">
            {[
              { label: 'Token Scan', icon: Search },
              { label: 'Fundraising', icon: DollarSign },
              { label: 'Calendar', icon: Calendar }
            ].map((item) => (
              <button
                key={item.label}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && <span className="text-left">{item.label}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Resources Section */}
        <div>
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Resources</h3>
          )}
          <div className="space-y-1">
            {[
              { label: 'Top Security Score', icon: Trophy },
              { label: 'Security Reports', icon: FileText }
            ].map((item) => (
              <button
                key={item.label}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && <span className="text-left">{item.label}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="p-4 border-t border-gray-800">
        {!isCollapsed ? (
          <div className="text-xs text-slate-500 space-y-1">
            <p>© 2024 BlitzProof</p>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-green-500">BTC $65,420</span>
              <span className="text-blue-500">ETH $3,247</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2 text-xs text-slate-500">
            <span className="text-green-500">$65K</span>
            <span className="text-blue-500">$3K</span>
          </div>
        )}
      </div>
    </div>
  )
}
