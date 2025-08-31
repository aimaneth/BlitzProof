'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ExternalLink, 
  FileText, 
  Users, 
  Bug, 
  CheckCircle2,
  Globe,
  Twitter,
  MessageCircle,
  Linkedin,
  Send,
  Github,
  BookOpen
} from 'lucide-react'

interface TokenInfoPanelProps {
  token: {
    name: string
    symbol: string
    rank: number
    audits: number
    website: string
    contractAddress: string
    contractScore: number
    tags: string[]
    socials: {
      twitter?: string
      telegram?: string
      discord?: string
      github?: string
      linkedin?: string
      medium?: string
      website?: string
    }
    description: string
  }
  className?: string
}

export default function TokenInfoPanel({ token, className = '' }: TokenInfoPanelProps) {
  const formatAddress = (address: string): string => {
    if (address.length > 10) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`
    }
    return address
  }

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'twitter':
        return <Twitter className="w-4 h-4" />
      case 'telegram':
        return <Send className="w-4 h-4" />
      case 'discord':
        return <MessageCircle className="w-4 h-4" />
      case 'github':
        return <Github className="w-4 h-4" />
      case 'linkedin':
        return <Linkedin className="w-4 h-4" />
      case 'medium':
        return <BookOpen className="w-4 h-4" />
      case 'website':
        return <Globe className="w-4 h-4" />
      default:
        return <ExternalLink className="w-4 h-4" />
    }
  }

     return (
     <div className={`${className}`}>
             {/* Token Header */}
       <div className="mb-4">
         <div className="flex items-center gap-2 mb-2">
           <h3 className="text-lg font-semibold text-white">{token.name} Info</h3>
           <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30 text-xs">
             #{token.rank}
           </Badge>
         </div>
       </div>

             {/* Info Sections */}
       <div className="space-y-3">
        {/* Audits */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Audits</span>
          <Button variant="link" className="text-blue-400 hover:text-blue-300 p-0 h-auto text-xs">
            {token.audits} Available
          </Button>
        </div>

        {/* Website */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Website</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white">{token.website}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1 h-auto"
              onClick={() => window.open(`https://${token.website}`, '_blank')}
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Token & Contracts */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Token & Contracts</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white font-mono">{formatAddress(token.contractAddress)}</span>
            <Badge className="bg-green-600/20 text-green-400 border-green-500/30 text-xs">
              {token.contractScore.toFixed(2)}
            </Badge>
          </div>
        </div>

        {/* Tags */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Tags</span>
          <div className="flex gap-1">
            {token.tags.map((tag, index) => (
              <Badge 
                key={index}
                variant="outline" 
                className="text-xs border-gray-600 text-gray-300"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Socials */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Socials</span>
          <div className="flex gap-2">
            {Object.entries(token.socials).map(([platform, url]) => {
              if (!url) return null
              return (
                <Button
                  key={platform}
                  variant="ghost"
                  size="sm"
                  className="p-1 h-auto text-gray-400 hover:text-white"
                  onClick={() => window.open(url, '_blank')}
                >
                  {getSocialIcon(platform)}
                </Button>
              )
            })}
          </div>
        </div>
      </div>

             {/* Description */}
       <div className="mt-4">
        <p className="text-xs text-gray-300 leading-relaxed">
          {token.description.length > 200 
            ? `${token.description.slice(0, 200)}...` 
            : token.description
          }
        </p>
        {token.description.length > 200 && (
          <Button variant="link" className="text-blue-400 hover:text-blue-300 p-0 h-auto text-xs">
            More
          </Button>
        )}
      </div>

                    {/* Verification Badges */}
       <div className="mt-4 p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
         <div className="grid grid-cols-2 gap-3">
           <div className="flex flex-col items-center text-center">
             <div className="w-10 h-10 bg-gray-800/50 border border-gray-600 rounded-lg flex items-center justify-center mb-2">
               <FileText className="w-5 h-5 text-gray-300" />
             </div>
             <span className="text-xs text-gray-400">BlitzProof Audit</span>
           </div>
           <div className="flex flex-col items-center text-center">
             <div className="w-10 h-10 bg-gray-800/50 border border-gray-600 rounded-lg flex items-center justify-center mb-2">
               <Users className="w-5 h-5 text-gray-300" />
             </div>
             <span className="text-xs text-gray-400">Team Verification</span>
           </div>
           <div className="flex flex-col items-center text-center">
             <div className="w-10 h-10 bg-gray-800/50 border border-gray-600 rounded-lg flex items-center justify-center mb-2">
               <Bug className="w-5 h-5 text-gray-300" />
             </div>
             <span className="text-xs text-gray-400">Bug Bounty</span>
           </div>
           <div className="flex flex-col items-center text-center">
             <div className="w-10 h-10 bg-gray-800/50 border border-gray-600 rounded-lg flex items-center justify-center mb-2">
               <CheckCircle2 className="w-5 h-5 text-gray-300" />
             </div>
             <span className="text-xs text-gray-400">Verified Contract</span>
           </div>
         </div>
       </div>
     </div>
   )
 }
