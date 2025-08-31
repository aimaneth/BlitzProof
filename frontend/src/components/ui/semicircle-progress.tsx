'use client'

import React, { useState, useRef } from 'react'

interface SemicircleProgressProps {
  score: number
  size?: number
  strokeWidth?: number
  className?: string
}

export default function SemicircleProgress({ 
  score, 
  size = 40, 
  strokeWidth = 4, 
  className = '' 
}: SemicircleProgressProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  
  const radius = (size - strokeWidth) / 2
  const circumference = radius * Math.PI
  const progress = Math.min(Math.max(score, 0), 100) / 100
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (progress * circumference)

  // Get color based on score
  const getColor = (score: number) => {
    if (score >= 90) return '#10b981' // green-500
    if (score >= 80) return '#34d399' // green-400
    if (score >= 70) return '#3b82f6' // blue-500
    if (score >= 60) return '#eab308' // yellow-500
    if (score >= 50) return '#f97316' // orange-500
    if (score >= 40) return '#f87171' // red-400
    return '#ef4444' // red-500
  }

  // Get score level description
  const getScoreLevel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 80) return 'Very Good'
    if (score >= 70) return 'Good'
    if (score >= 60) return 'Fair'
    if (score >= 50) return 'Poor'
    if (score >= 40) return 'Very Poor'
    return 'Critical'
  }

  const color = getColor(score)
  const scoreLevel = getScoreLevel(score)

  const handleMouseEnter = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      })
    }
    setShowTooltip(true)
  }

  const handleMouseLeave = () => {
    setShowTooltip(false)
  }

    return (
    <div 
      ref={containerRef}
      className={`relative inline-flex items-center justify-center ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <svg
        width={size}
        height={size / 2}
        className="transform rotate-0 cursor-pointer transition-transform duration-200 hover:scale-105"
        style={{ overflow: 'visible' }}
      >
        {/* Background semicircle */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        
        {/* Progress semicircle */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: 'stroke-dashoffset 0.5s ease-in-out',
            filter: 'drop-shadow(0 0 4px rgba(0, 0, 0, 0.3))'
          }}
        />
             </svg>
       
               {/* Score text below the semicircle */}
        <div className="absolute top-full -mt-1 flex items-center justify-center w-full">
          <span 
            className="text-xs font-bold text-white"
            style={{ 
              color: color,
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
            }}
          >
            {Math.round(score)}
          </span>
        </div>

        {/* Sleek Tooltip */}
        {showTooltip && (
          <div 
            className="fixed z-[9999] pointer-events-none"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y,
              transform: 'translateX(-50%) translateY(-100%)'
            }}
          >
            <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg px-3 py-2 shadow-2xl">
              <div className="text-center">
                <div className="text-sm font-semibold text-white mb-1">
                  Security Score
                </div>
                <div className="text-lg font-bold" style={{ color: color }}>
                  {Math.round(score)}/100
                </div>
                <div className="text-xs text-gray-300 mt-1">
                  {scoreLevel}
                </div>
              </div>
              {/* Tooltip arrow */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900/95"></div>
            </div>
          </div>
        )}
      </div>
    )
  }
