"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

import { Header } from "@/components/layout/header"
import { useWallet } from "@/hooks/use-wallet"
import { apiService } from "@/lib/api"
import { 
  User, 
  Settings, 
  Key, 
  Shield, 
  Bell, 
  Download, 
  Copy, 
  RefreshCw,
  Eye,
  EyeOff,
  Save,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Zap,
  Target,
  BarChart3
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
  const { isConnected, isAuthenticated, address, shortAddress } = useWallet()
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
      const result = await apiService.updateProfile({
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
      const result = await apiService.createApiKey(newApiKeyName)
      
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
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
          <div className="text-center max-w-md mx-auto">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-8">
              <User className="h-16 w-16 text-primary mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-foreground mb-3">
                Connect Your Wallet
              </h2>
              <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
                Connect your wallet to access your profile and manage your account settings.
              </p>
              <Button className="w-full">
                Connect Wallet
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        {/* Enhanced Header with Sleek Background */}
        <div className="relative mb-8 overflow-hidden rounded-2xl">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5"></div>
          
          {/* Animated Background Patterns */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
          </div>
          
          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
          
          {/* Content */}
          <div className="relative z-10 p-8 rounded-2xl border border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <User className="h-12 w-12 text-primary relative z-10" />
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg"></div>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold gradient-text-subtle">
                      Profile Settings
                    </h1>
                    <div className="h-1 w-24 bg-gradient-to-r from-primary to-blue-500 rounded-full mt-2"></div>
                  </div>
                </div>
                
                <p className="text-xl text-muted-foreground mb-6 max-w-2xl">
                  Manage your account settings, API keys, and scan preferences
                </p>
                
                <div className="flex items-center gap-8 text-sm">
                  <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg border border-white/10 backdrop-blur-sm">
                    <div className="p-1 bg-green-500/20 rounded-full">
                      <User className="h-4 w-4 text-green-400" />
                    </div>
                    <span className="text-white/80 font-medium">Account</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg border border-white/10 backdrop-blur-sm">
                    <div className="p-1 bg-blue-500/20 rounded-full">
                      <Key className="h-4 w-4 text-blue-400" />
                    </div>
                    <span className="text-white/80 font-medium">API Keys</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg border border-white/10 backdrop-blur-sm">
                    <div className="p-1 bg-purple-500/20 rounded-full">
                      <Settings className="h-4 w-4 text-purple-400" />
                    </div>
                    <span className="text-white/80 font-medium">Preferences</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button 
                  onClick={saveProfile} 
                  disabled={saving}
                  className="bg-primary hover:bg-primary/90 shadow-lg"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <Card className="bg-card/50 backdrop-blur-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{username || "Anonymous"}</h3>
                  <p className="text-sm text-muted-foreground">{shortAddress}</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Member since</span>
                    <span className="text-sm font-medium">{formatDate(profile?.user.created_at || "")}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total scans</span>
                    <Badge variant="secondary">{profile?.stats.scan_count || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Vulnerabilities found</span>
                    <Badge variant="destructive">{profile?.stats.total_vulnerabilities || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Average score</span>
                    <Badge variant="outline">{profile?.stats.average_score || 0}/100</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="bg-card/50 backdrop-blur-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Scan Preferences */}
            <Card className="bg-card/50 backdrop-blur-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Scan Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive email notifications when scans complete</p>
                  </div>
                  <Switch
                    id="notifications"
                    checked={notificationsEnabled}
                    onCheckedChange={setNotificationsEnabled}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-export">Auto Export</Label>
                    <p className="text-sm text-muted-foreground">Automatically export scan results</p>
                  </div>
                  <Switch
                    id="auto-export"
                    checked={autoExport}
                    onCheckedChange={setAutoExport}
                  />
                </div>
                <div>
                  <Label htmlFor="timeout">Scan Timeout (seconds)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={scanTimeout}
                    onChange={(e) => setScanTimeout(parseInt(e.target.value) || 300)}
                    min="60"
                    max="1800"
                  />
                </div>
                <div>
                  <Label htmlFor="network">Default Network</Label>
                  <select
                    id="network"
                    value={defaultNetwork}
                    onChange={(e) => setDefaultNetwork(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md"
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
            <Card className="bg-card/50 backdrop-blur-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API Keys
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Create new API key */}
                <div className="flex gap-2">
                  <Input
                    placeholder="API key name"
                    value={newApiKeyName}
                    onChange={(e) => setNewApiKeyName(e.target.value)}
                  />
                  <Button 
                    onClick={createApiKey} 
                    disabled={creatingApiKey || !newApiKeyName.trim()}
                  >
                    {creatingApiKey ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Key className="h-4 w-4 mr-2" />
                        Create Key
                      </>
                    )}
                  </Button>
                </div>

                {/* API Keys List */}
                <div className="space-y-3">
                  {profile?.api_keys.map((apiKey) => (
                    <div key={apiKey.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{apiKey.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Created {formatDate(apiKey.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowApiKey(showApiKey === apiKey.id ? null : apiKey.id)}
                          >
                            {showApiKey === apiKey.id ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(apiKey.key)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteApiKey(apiKey.id)}
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
                            className="font-mono text-sm"
                          />
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 mt-2">
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
    </div>
  )
} 