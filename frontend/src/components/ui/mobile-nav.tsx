'use client'

import { useState, useEffect } from 'react'
import { Menu, X, Home, TrendingUp, Shield, Activity, Settings, Search, Bell, User, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useNotifications } from '@/contexts/NotificationContext'
import NotificationBell from './notification-bell'
import AdvancedSearch from './advanced-search'

interface MobileNavProps {
  activeSection: string
  onSectionChange: (section: string) => void
  isAuthenticated: boolean
  user?: any
  onSignIn: () => void
  onSignOut: () => void
}

export default function MobileNav({ 
  activeSection, 
  onSectionChange, 
  isAuthenticated, 
  user, 
  onSignIn, 
  onSignOut 
}: MobileNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { unreadCount } = useNotifications()

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.mobile-nav')) {
        setIsMenuOpen(false)
        setIsSearchOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: Home, color: 'text-blue-500' },
    { id: 'trending', label: 'Trending', icon: TrendingUp, color: 'text-green-500' },
    { id: 'security', label: 'Security', icon: Shield, color: 'text-red-500' },
    { id: 'activity', label: 'Activity', icon: Activity, color: 'text-purple-500' },
  ]

  const handleSectionChange = (section: string) => {
    onSectionChange(section)
    setIsMenuOpen(false)
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden bg-[#0F1011] border-b border-gray-800 sticky top-0 z-40 -mb-px">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg">BlitzProof</span>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            {/* Search Button */}
            <Button
              size="sm"
              variant="ghost"
              className="h-10 w-10 p-0 text-gray-400 hover:text-white"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Notification Bell */}
            <div className="relative">
              <NotificationBell />
            </div>

            {/* Menu Button */}
            <Button
              size="sm"
              variant="ghost"
              className="h-10 w-10 p-0 text-gray-400 hover:text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isSearchOpen && (
          <div className="px-4 pb-4">
            <AdvancedSearch />
          </div>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
          <Card className="absolute top-0 right-0 h-full w-80 bg-[#111213] border-l border-gray-800 shadow-xl">
            <div className="p-6">
              {/* Menu Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white font-semibold text-lg">Menu</h2>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Navigation Items */}
              <div className="space-y-2 mb-6">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        activeSection === item.id
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                          : 'text-gray-300 hover:bg-gray-800/50'
                      }`}
                      onClick={() => handleSectionChange(item.id)}
                    >
                      <Icon className={`h-5 w-5 ${item.color}`} />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* User Section */}
              <div className="border-t border-gray-800 pt-6">
                {isAuthenticated ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{user?.name || 'User'}</p>
                        <p className="text-gray-400 text-sm">{user?.email}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <button className="w-full text-left p-3 text-gray-300 hover:bg-gray-800/50 rounded-lg transition-colors">
                        <Settings className="h-4 w-4 inline mr-3" />
                        Settings
                      </button>
                      <button 
                        onClick={() => {
                          window.open('/blocknet/admin', '_blank')
                          setIsMenuOpen(false)
                        }}
                        className="w-full text-left p-3 text-gray-300 hover:bg-gray-800/50 rounded-lg transition-colors"
                      >
                        <Shield className="h-4 w-4 inline mr-3" />
                        Admin Panel
                      </button>
                      <button 
                        onClick={() => {
                          onSignOut()
                          setIsMenuOpen(false)
                        }}
                        className="w-full text-left p-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => {
                      onSignIn()
                      setIsMenuOpen(false)
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Bottom Tab Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#111213] border-t border-gray-800 z-40">
        <div className="flex items-center justify-around h-16 px-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                  isActive
                    ? 'text-blue-400 bg-blue-600/20'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
                onClick={() => handleSectionChange(item.id)}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {item.id === 'activity' && unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-xs">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>

    </>
  )
}
