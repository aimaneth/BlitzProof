"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

import { Layout } from "@/components/layout/layout"
import { useWeb3Modal } from "@/hooks/use-web3modal"
import { apiService } from "@/lib/api"
import { 
  User, 
  Settings, 
  Key, 
  Copy, 
  RefreshCw,
  Eye,
  EyeOff,
  Save,
  Target
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface UserProfile {
  user: {
    id: number
    wallet_address: string
    username?: string
    email?: string
    created_at: string
  }
  stats: {
    scan_count: number
    total_vulnerabilities: number
    average_score: number
  }
  api_keys: ApiKey[]
}

interface ApiKey {
  id: string
  name: string
  key: string
  created_at: string
  last_used?: string
  permissions: string[]
}

export default function ProfilePage() {
  const { isConnected, isAuthenticated, shortAddress } = useWeb3Modal()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showApiKey, setShowApiKey] = useState<string | null>(null)
  const [newApiKeyName, setNewApiKeyName] = useState("")
  const [creatingApiKey, setCreatingApiKey] = useState(false)

  // Form states
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [autoExport, setAutoExport] = useState(false)
  const [scanTimeout, setScanTimeout] = useState(300)
  const [defaultNetwork, setDefaultNetwork] = useState("ethereum")

  useEffect(() => {
    if (isConnected && isAuthenticated) {
      fetchProfile()
    } else if (!isConnected) {
      setLoading(false)
    }
  }, [isConnected, isAuthenticated])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const profileData = await apiService.getUserProfile()
      setProfile(profileData)
      setUsername(profileData.user.username || "")
      setEmail(profileData.user.email || "")
      // Set default preferences if not available
      setNotificationsEnabled(true)
      setAutoExport(false)
      setScanTimeout(300)
      setDefaultNetwork("ethereum")
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    try {
      setSaving(true)
      await apiService.updateProfile({
        username,
        email,
        preferences: {
          notifications_enabled: notificationsEnabled,
          auto_export: autoExport,
          scan_timeout: scanTimeout,
          default_network: defaultNetwork
        }
      })
      
      // Refresh profile data
      await fetchProfile()
      
      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const createApiKey = async () => {
    if (!newApiKeyName.trim()) {
      toast.error('Please enter a name for the API key')
      return
    }

    try {
      setCreatingApiKey(true)
      await apiService.createApiKey(newApiKeyName)
      
      // Refresh profile data to get updated API keys
      await fetchProfile()
      
      setNewApiKeyName("")
      toast.success('API key created successfully')
    } catch (error) {
      console.error('Error creating API key:', error)
      toast.error('Failed to create API key')
    } finally {
      setCreatingApiKey(false)
    }
  }

  const deleteApiKey = async (keyId: string) => {
    try {
      await apiService.deleteApiKey(keyId)
      
      // Refresh profile data to get updated API keys
      await fetchProfile()
      
      toast.success('API key deleted successfully')
    } catch (error) {
      console.error('Error deleting API key:', error)
      toast.error('Failed to delete API key')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Wallet connection check
  if (!isConnected) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
          <div className="text-center max-w-md mx-auto">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6 sm:p-8">
              <User className="h-12 w-12 sm:h-16 sm:w-16 text-primary mx-auto mb-4 sm:mb-6" />
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2 sm:mb-3">
                Connect Your Wallet
              </h2>
              <p className="text-muted-foreground mb-6 sm:mb-8 text-sm leading-relaxed">
                Connect your wallet to access your profile and manage your account settings.
              </p>
              <Button className="w-full">
                Connect Wallet
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary mx-auto mb-3 sm:mb-4" />
          <p className="text-muted-foreground text-sm sm:text-base">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 lg:px-8">
        {/* Enhanced Header with Sleek Background */}
        <div className="relative mb-6 sm:mb-8 overflow-hidden rounded-xl sm:rounded-2xl">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5"></div>
          
          {/* Animated Background Patterns */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-48 sm:w-72 h-48 sm:h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute bottom-0 left-1/4 w-56 sm:w-80 h-56 sm:h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
          </div>
          
          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
          
          {/* Content */}
          <div className="relative z-10 p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl border border-white/10 backdrop-blur-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-0">
              <div className="flex-1">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="relative">
                    <User className="h-8 w-8 sm:h-12 sm:w-12 text-primary relative z-10" />
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg"></div>
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold gradient-text-subtle">
                      Profile Settings
                    </h1>
                    <div className="h-1 w-16 sm:w-24 bg-gradient-to-r from-primary to-blue-500 rounded-full mt-1 sm:mt-2"></div>
                  </div>
                </div>
                
                <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-4 sm:mb-6 max-w-2xl">
                  Manage your account settings, API keys, and scan preferences
                </p>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm">
                  <div className="flex items-center gap-2 bg-white/5 px-3 sm:px-4 py-2 rounded-lg border border-white/10 backdrop-blur-sm">
                    <div className="p-1 bg-green-500/20 rounded-full">
                      <User className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
                    </div>
                    <span className="text-white/80 font-medium text-xs sm:text-sm">Account</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 px-3 sm:px-4 py-2 rounded-lg border border-white/10 backdrop-blur-sm">
                    <div className="p-1 bg-blue-500/20 rounded-full">
                      <Key className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
                    </div>
                    <span className="text-white/80 font-medium text-xs sm:text-sm">API Keys</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 px-3 sm:px-4 py-2 rounded-lg border border-white/10 backdrop-blur-sm">
                    <div className="p-1 bg-purple-500/20 rounded-full">
                      <Settings className="h-3 w-3 sm:h-4 sm:w-4 text-purple-400" />
                    </div>
                    <span className="text-white/80 font-medium text-xs sm:text-sm">Preferences</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3">
                <Button 
                  onClick={saveProfile} 
                  disabled={saving}
                  className="bg-primary hover:bg-primary/90 shadow-lg"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                      <span className="text-xs sm:text-sm">Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="text-xs sm:text-sm">Save Changes</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <Card className="bg-card/50 backdrop-blur-sm rounded-xl sm:rounded-2xl">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  Profile Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <User className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">{username || "Anonymous"}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground break-all">{shortAddress}</p>
                </div>
                
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-muted-foreground">Member since</span>
                    <span className="text-xs sm:text-sm font-medium">{formatDate(profile?.user.created_at || "")}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-muted-foreground">Total scans</span>
                    <Badge variant="secondary" className="text-xs">{profile?.stats.scan_count || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-muted-foreground">Vulnerabilities found</span>
                    <Badge variant="destructive" className="text-xs">{profile?.stats.total_vulnerabilities || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-muted-foreground">Average score</span>
                    <Badge variant="outline" className="text-xs">{profile?.stats.average_score || 0}/100</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Basic Information */}
            <Card className="bg-card/50 backdrop-blur-sm rounded-xl sm:rounded-2xl">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div>
                  <Label htmlFor="username" className="text-sm">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Scan Preferences */}
            <Card className="bg-card/50 backdrop-blur-sm rounded-xl sm:rounded-2xl">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5" />
                  Scan Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                  <div className="flex-1">
                    <Label htmlFor="notifications" className="text-sm">Email Notifications</Label>
                    <p className="text-xs sm:text-sm text-muted-foreground">Receive email notifications when scans complete</p>
                  </div>
                  <Switch
                    id="notifications"
                    checked={notificationsEnabled}
                    onCheckedChange={setNotificationsEnabled}
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                  <div className="flex-1">
                    <Label htmlFor="auto-export" className="text-sm">Auto Export</Label>
                    <p className="text-xs sm:text-sm text-muted-foreground">Automatically export scan results</p>
                  </div>
                  <Switch
                    id="auto-export"
                    checked={autoExport}
                    onCheckedChange={setAutoExport}
                  />
                </div>
                <div>
                  <Label htmlFor="timeout" className="text-sm">Scan Timeout (seconds)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={scanTimeout}
                    onChange={(e) => setScanTimeout(parseInt(e.target.value) || 300)}
                    min="60"
                    max="1800"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="network" className="text-sm">Default Network</Label>
                  <select
                    id="network"
                    value={defaultNetwork}
                    onChange={(e) => setDefaultNetwork(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
                  >
                    <option value="ethereum">Ethereum</option>
                    <option value="polygon">Polygon</option>
                    <option value="bsc">BSC</option>
                    <option value="arbitrum">Arbitrum</option>
                    <option value="optimism">Optimism</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* API Keys */}
            <Card className="bg-card/50 backdrop-blur-sm rounded-xl sm:rounded-2xl">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Key className="h-4 w-4 sm:h-5 sm:w-5" />
                  API Keys
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {/* Create new API key */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="API key name"
                    value={newApiKeyName}
                    onChange={(e) => setNewApiKeyName(e.target.value)}
                    className="text-sm"
                  />
                  <Button 
                    onClick={createApiKey} 
                    disabled={creatingApiKey || !newApiKeyName.trim()}
                    className="text-xs sm:text-sm"
                  >
                    {creatingApiKey ? (
                      <>
                        <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                        <span className="text-xs sm:text-sm">Creating...</span>
                      </>
                    ) : (
                      <>
                        <Key className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="text-xs sm:text-sm">Create Key</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* API Keys List */}
                <div className="space-y-3">
                  {profile?.api_keys.map((apiKey) => (
                    <div key={apiKey.id} className="border border-border rounded-lg p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm sm:text-base">{apiKey.name}</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Created {formatDate(apiKey.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowApiKey(showApiKey === apiKey.id ? null : apiKey.id)}
                            className="h-8 w-8 sm:h-9 sm:w-auto p-0 sm:px-3"
                          >
                            {showApiKey === apiKey.id ? (
                              <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />
                            ) : (
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(apiKey.key)}
                            className="h-8 w-8 sm:h-9 sm:w-auto p-0 sm:px-3"
                          >
                            <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteApiKey(apiKey.id)}
                            className="h-8 sm:h-9 text-xs"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                      
                      {showApiKey === apiKey.id && (
                        <div className="mt-2">
                          <Input
                            value={apiKey.key}
                            readOnly
                            className="font-mono text-xs sm:text-sm"
                          />
                        </div>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-2">
                        {apiKey.permissions.map((permission) => (
                          <Badge key={permission} variant="secondary" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                      
                      {apiKey.last_used && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Last used: {formatDate(apiKey.last_used)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  )
} 