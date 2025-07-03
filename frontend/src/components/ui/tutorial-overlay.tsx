'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Eye,
  Settings,
  Shield,
  Target,
  CheckCircle
} from 'lucide-react'

interface TutorialStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  target?: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
            title: 'Welcome to BlitzProof Security Scanner',
    description: 'Let\'s get you started with smart contract security analysis. This tutorial will guide you through the key features.',
    icon: <Shield className="h-6 w-6" />,
    position: 'center'
  },
  {
    id: 'input-method',
    title: 'Choose Your Input Method',
    description: 'You can either upload a Solidity file or analyze a deployed contract by its address. Both methods support drag & drop!',
    icon: <Shield className="h-6 w-6" />,
    target: '.input-method-toggle',
    position: 'right'
  },
  {
    id: 'file-upload',
    title: 'File Upload',
    description: 'Drag and drop your .sol file here or click to browse. Supports files up to 10MB with real-time validation.',
    icon: <Shield className="h-6 w-6" />,
    target: '.file-upload-area',
    position: 'right'
  },
  {
    id: 'contract-address',
    title: 'Contract Address Analysis',
    description: 'Enter a deployed contract address to analyze verified contracts from multiple blockchains.',
    icon: <Target className="h-6 w-6" />,
    target: '.contract-address-input',
    position: 'right'
  },
  {
    id: 'scan-configuration',
    title: 'Scan Configuration',
    description: 'Customize your security analysis with different tools, severity levels, and AI analysis options.',
    icon: <Settings className="h-6 w-6" />,
    target: '.scan-config-button',
    position: 'right'
  },
  {
    id: 'start-scan',
    title: 'Start Security Analysis',
    description: 'Click here to begin comprehensive vulnerability detection using multiple security tools and AI analysis.',
    icon: <Shield className="h-6 w-6" />,
    target: '.start-scan-button',
    position: 'right'
  },
  {
    id: 'results',
    title: 'Quick Actions & Results',
    description: 'Use these quick actions to start scanning. After completing a scan, your detailed vulnerability reports, security scores, and AI-generated remediation suggestions will appear in this area.',
    icon: <Eye className="h-6 w-6" />,
    target: '.results-area',
    position: 'right'
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
            description: 'You now know how to use BlitzProof Security Scanner. Start by uploading a contract or entering an address to begin your first security analysis.',
    icon: <CheckCircle className="h-6 w-6" />,
    position: 'center'
  }
]

interface TutorialOverlayProps {
  isOpen: boolean
  onClose: () => void
}

// Tutorial Card Component
interface TutorialCardProps {
  step: TutorialStep
  currentStep: number
  totalSteps: number
  isFirstStep: boolean
  isLastStep: boolean
  onNext: () => void
  onPrevious: () => void
  onSkip: () => void
}

function TutorialCard({ 
  step, 
  currentStep, 
  totalSteps, 
  isFirstStep, 
  isLastStep, 
  onNext, 
  onPrevious, 
  onSkip 
}: TutorialCardProps) {
  const [cardPosition, setCardPosition] = useState({ top: '50%', left: '50%' })

  const updateCardPosition = useCallback(() => {
    if (step.target) {
      const targetElement = document.querySelector(step.target)
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect()
        const cardWidth = 384 // w-96 = 24rem = 384px
        const cardHeight = 400 // Approximate height
        const padding = 20 // Minimum distance from target
        const highlightPadding = 12 // Padding used in highlight
        
        let top = '50%'
        let left = '50%'
        
        // Calculate highlight boundaries
        const highlightTop = rect.top - highlightPadding
        const highlightLeft = rect.left - highlightPadding
        const highlightWidth = rect.width + (highlightPadding * 2)
        const highlightHeight = rect.height + (highlightPadding * 2)
        const highlightBottom = highlightTop + highlightHeight
        const highlightRight = highlightLeft + highlightWidth
        

        
        // Position card based on target element and position preference
        switch (step.position) {
          case 'center':
            // Center the card on the page
            top = '50%'
            left = '50%'
            break
          case 'top':
            top = `${Math.max(padding, highlightTop - cardHeight - padding - 50)}px`
            // Keep horizontal position more stable - center on target but with constraints
            const topLeft = Math.max(padding, highlightLeft + highlightWidth / 2 - cardWidth / 2)
            left = `${Math.min(window.innerWidth - cardWidth - padding, topLeft)}px`
            break
          case 'bottom':
            top = `${Math.min(window.innerHeight - cardHeight - padding, highlightBottom + padding + 50)}px`
            // Keep horizontal position more stable - center on target but with constraints
            const bottomLeft = Math.max(padding, highlightLeft + highlightWidth / 2 - cardWidth / 2)
            left = `${Math.min(window.innerWidth - cardWidth - padding, bottomLeft)}px`
            break
          case 'left':
            top = `${Math.max(padding, Math.min(window.innerHeight - cardHeight - padding, highlightTop + highlightHeight / 2 - cardHeight / 2))}px`
            left = `${Math.max(padding, highlightLeft - cardWidth - padding - 50)}px`
            break
          case 'right':
            top = `${Math.max(padding, Math.min(window.innerHeight - cardHeight - padding, highlightTop + highlightHeight / 2 - cardHeight / 2))}px`
            left = `${Math.min(window.innerWidth - cardWidth - padding, highlightRight + padding + 50)}px`
            break
          default:
            // Smart positioning: avoid overlap with highlight
            const centerX = highlightLeft + highlightWidth / 2
            const centerY = highlightTop + highlightHeight / 2
            
            // Try to position card to avoid overlap with highlight
            if (centerY > window.innerHeight / 2) {
              // Highlight is in bottom half, position card above
              top = `${Math.max(padding, highlightTop - cardHeight - padding - 50)}px`
            } else {
              // Highlight is in top half, position card below
              top = `${Math.min(window.innerHeight - cardHeight - padding, highlightBottom + padding + 50)}px`
            }
            
            if (centerX > window.innerWidth / 2) {
              // Highlight is in right half, position card to the left
              left = `${Math.max(padding, highlightLeft - cardWidth - padding - 50)}px`
            } else {
              // Highlight is in left half, position card to the right
              left = `${Math.min(window.innerWidth - cardWidth - padding, highlightRight + padding + 50)}px`
            }
        }
        
        setCardPosition({ top, left })
      }
    } else if (step.position === 'center') {
      // Handle center positioning when there's no target element
      setCardPosition({ top: '50%', left: '50%' })
    }
  }, [step.target, step.position]);

  useEffect(() => {
    // Initial update
    updateCardPosition()

    // Throttled update function
    let timeoutId: NodeJS.Timeout
    const throttledUpdate = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(updateCardPosition, 16) // ~60fps
    }

    // Update on scroll and resize
    window.addEventListener('scroll', throttledUpdate, { passive: true })
    window.addEventListener('resize', updateCardPosition)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('scroll', throttledUpdate)
      window.removeEventListener('resize', updateCardPosition)
    }
  }, [step.target, step.position, updateCardPosition])

  return (
    <div 
      className="fixed z-[10000]"
      style={{ 
        top: cardPosition.top === '50%' ? '50%' : cardPosition.top,
        left: cardPosition.left === '50%' ? '50%' : cardPosition.left,
        transform: cardPosition.top === '50%' && cardPosition.left === '50%' ? 'translate(-50%, -50%)' : 'none'
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <Card className="w-96 bg-card/95 backdrop-blur-sm border border-white/20 shadow-2xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                {step.icon}
                {step.title}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkip}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground leading-relaxed">
              {step.description}
            </p>
            
            {/* Progress Indicator */}
            <div className="flex items-center justify-between">
              <div className="flex space-x-1">
                {Array.from({ length: totalSteps }).map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 w-2 rounded-full transition-colors ${
                      index <= currentStep ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {currentStep + 1} of {totalSteps}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={onPrevious}
                disabled={isFirstStep}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <Button
                onClick={onNext}
                className="flex items-center gap-2"
              >
                {isLastStep ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Get Started
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>

            {/* Skip Tutorial */}
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkip}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Skip tutorial
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}



export function TutorialOverlay({ isOpen, onClose }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [highlightMask, setHighlightMask] = useState<React.CSSProperties>({})



  // Reset tutorial state when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0)
      localStorage.setItem('blitzproof-tutorial-current-step', '0')
    }
  }, [isOpen])

  // Update localStorage when step changes
  useEffect(() => {
    if (isOpen) {
              localStorage.setItem('blitzproof-tutorial-current-step', currentStep.toString())
      // Dispatch custom event for same-tab communication
      window.dispatchEvent(new CustomEvent('tutorial-step-change', { detail: currentStep }))
      
      // Auto-scroll for specific steps
      setTimeout(() => {
        if (currentStep === 2) { // Step 3 (file-upload) - scroll to file upload area
          const fileUploadElement = document.querySelector('.file-upload-area')
          if (fileUploadElement) {
            fileUploadElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            })
            // Update highlight mask after scroll completes
            setTimeout(() => {
              const step = tutorialSteps[currentStep]
              if (step.target) {
                const targetElement = document.querySelector(step.target)
                if (targetElement) {
                  const rect = targetElement.getBoundingClientRect()
                  const padding = 12
                  setHighlightMask({
                    position: 'fixed',
                    top: rect.top - padding,
                    left: rect.left - padding,
                    width: rect.width + (padding * 2),
                    height: rect.height + (padding * 2),
                    zIndex: 9999,
                    backgroundColor: 'transparent',
                    border: '4px solid hsl(var(--primary))',
                    borderRadius: '8px',
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.8)',
                    pointerEvents: 'none'
                  })
                }
              }
            }, 800) // Wait for scroll to complete
          }
        } else if (currentStep === 4) { // Step 5 (start-scan) - scroll to bottom
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
          })
          // Update highlight mask after scroll completes
          setTimeout(() => {
            const step = tutorialSteps[currentStep]
            if (step.target) {
              const targetElement = document.querySelector(step.target)
              if (targetElement) {
                const rect = targetElement.getBoundingClientRect()
                const padding = 12
                setHighlightMask({
                  position: 'fixed',
                  top: rect.top - padding,
                  left: rect.left - padding,
                  width: rect.width + (padding * 2),
                  height: rect.height + (padding * 2),
                  zIndex: 9999,
                  backgroundColor: 'transparent',
                  border: '4px solid hsl(var(--primary))',
                  borderRadius: '8px',
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.8)',
                  pointerEvents: 'none'
                })
              }
            }
          }, 800) // Wait for scroll to complete
        } else if (currentStep === 6) { // Step 7 (results) - scroll to top
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          })
          // Update highlight mask after scroll completes
          setTimeout(() => {
            const step = tutorialSteps[currentStep]
            if (step.target) {
              const targetElement = document.querySelector(step.target)
              if (targetElement) {
                const rect = targetElement.getBoundingClientRect()
                const padding = 12
                setHighlightMask({
                  position: 'fixed',
                  top: rect.top - padding,
                  left: rect.left - padding,
                  width: rect.width + (padding * 2),
                  height: rect.height + (padding * 2),
                  zIndex: 9999,
                  backgroundColor: 'transparent',
                  border: '4px solid hsl(var(--primary))',
                  borderRadius: '8px',
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.8)',
                  pointerEvents: 'none'
                })
              }
            }
          }, 800) // Wait for scroll to complete
        }
      }, 300) // Small delay to ensure the step transition is complete
    }
  }, [currentStep, isOpen])

  // Update highlight mask when step changes
  useEffect(() => {
    const updateHighlightMask = () => {
      const step = tutorialSteps[currentStep]
      if (step.target) {
        const targetElement = document.querySelector(step.target)
        if (targetElement) {
          const rect = targetElement.getBoundingClientRect()
          const padding = 12
          
          const maskStyle: React.CSSProperties = {
            position: 'fixed',
            top: rect.top - padding,
            left: rect.left - padding,
            width: rect.width + (padding * 2),
            height: rect.height + (padding * 2),
            zIndex: 9999,
            backgroundColor: 'transparent',
            border: '4px solid hsl(var(--primary))',
            borderRadius: '8px',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.8)',
            pointerEvents: 'none'
          }
          

          
          setHighlightMask(maskStyle)
        }
      } else {
        setHighlightMask({})
      }
    }

    // Initial update
    updateHighlightMask()

    // Update on scroll and resize
    window.addEventListener('scroll', updateHighlightMask)
    window.addEventListener('resize', updateHighlightMask)

    return () => {
      window.removeEventListener('scroll', updateHighlightMask)
      window.removeEventListener('resize', updateHighlightMask)
    }
  }, [currentStep])

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeTutorial()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const completeTutorial = () => {
    localStorage.setItem('blitzproof-tutorial-seen', 'true')
    onClose()
  }

  const skipTutorial = () => {
    localStorage.setItem('blitzproof-tutorial-seen', 'true')
    onClose()
  }

  const step = tutorialSteps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === tutorialSteps.length - 1

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999]"
      >
        {/* Background overlay - only for steps without targets (first and last) */}
        {!step.target && (
          <div 
            className="fixed inset-0 bg-black/80"
            style={{ zIndex: 9998 }}
          />
        )}

        {/* Tutorial Card - Render first (lower z-index) */}
        <TutorialCard 
          step={step} 
          currentStep={currentStep}
          totalSteps={tutorialSteps.length}
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
          onNext={handleNext} 
          onPrevious={handlePrevious} 
          onSkip={skipTutorial} 
        />

        {/* Highlight Mask - Creates cut-out effect */}
        {step.target && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={highlightMask}
          />
        )}
      </motion.div>
    </AnimatePresence>
  )
}

// Hook to manage tutorial state
export function useTutorial() {
  const [isTutorialOpen, setIsTutorialOpen] = useState(false)

  const openTutorial = () => {
    console.log('openTutorial called')
    setIsTutorialOpen(true)
  }
  
  const closeTutorial = () => {
    console.log('closeTutorial called')
    setIsTutorialOpen(false)
  }

  return {
    isTutorialOpen,
    openTutorial,
    closeTutorial
  }
} 