"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect, memo, useCallback, useRef } from "react"
import { cn } from "@/lib/utils"
import { animate } from "framer-motion"

// Glowing effect component
interface GlowingEffectProps {
  blur?: number;
  inactiveZone?: number;
  proximity?: number;
  spread?: number;
  variant?: "default" | "white";
  glow?: boolean;
  className?: string;
  disabled?: boolean;
  movementDuration?: number;
  borderWidth?: number;
}

const GlowingEffect = memo(
  ({
    blur = 0,
    inactiveZone = 0.7,
    proximity = 0,
    spread = 20,
    variant = "default",
    glow = false,
    className,
    movementDuration = 2,
    borderWidth = 1,
    disabled = true,
  }: GlowingEffectProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const lastPosition = useRef({ x: 0, y: 0 });
    const animationFrameRef = useRef<number>(0);

    const handleMove = useCallback(
      (e?: MouseEvent | { x: number; y: number }) => {
        if (!containerRef.current) return;

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        animationFrameRef.current = requestAnimationFrame(() => {
          const element = containerRef.current;
          if (!element) return;

          const { left, top, width, height } = element.getBoundingClientRect();
          const mouseX = e?.x ?? lastPosition.current.x;
          const mouseY = e?.y ?? lastPosition.current.y;

          if (e) {
            lastPosition.current = { x: mouseX, y: mouseY };
          }

          const center = [left + width * 0.5, top + height * 0.5];
          const distanceFromCenter = Math.hypot(
            mouseX - center[0],
            mouseY - center[1]
          );
          const inactiveRadius = 0.5 * Math.min(width, height) * inactiveZone;

          if (distanceFromCenter < inactiveRadius) {
            element.style.setProperty("--active", "0");
            return;
          }

          const isActive =
            mouseX > left - proximity &&
            mouseX < left + width + proximity &&
            mouseY > top - proximity &&
            mouseY < top + height + proximity;

          element.style.setProperty("--active", isActive ? "1" : "0");

          if (!isActive) return;

          const currentAngle =
            parseFloat(element.style.getPropertyValue("--start")) || 0;
          const targetAngle =
            (180 * Math.atan2(mouseY - center[1], mouseX - center[0])) /
              Math.PI +
            90;

          const angleDiff = ((targetAngle - currentAngle + 180) % 360) - 180;
          const newAngle = currentAngle + angleDiff;

          animate(currentAngle, newAngle, {
            duration: movementDuration,
            ease: [0.16, 1, 0.3, 1],
            onUpdate: (value) => {
              element.style.setProperty("--start", String(value));
            },
          });
        });
      },
      [inactiveZone, proximity, movementDuration]
    );

    useEffect(() => {
      if (disabled) return;

      const handleScroll = () => handleMove();
      const handlePointerMove = (e: PointerEvent) => handleMove(e);

      window.addEventListener("scroll", handleScroll, { passive: true });
      document.body.addEventListener("pointermove", handlePointerMove, {
        passive: true,
      });

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        window.removeEventListener("scroll", handleScroll);
        document.body.removeEventListener("pointermove", handlePointerMove);
      };
    }, [handleMove, disabled]);

    return (
      <>
        <div
          className={cn(
            "pointer-events-none absolute -inset-px hidden rounded-[inherit] border opacity-0 transition-opacity",
            glow && "opacity-100",
            variant === "white" && "border-white",
            disabled && "!block"
          )}
        />
        <div
          ref={containerRef}
          style={
            {
              "--blur": `${blur}px`,
              "--spread": spread,
              "--start": "0",
              "--active": "0",
              "--glowingeffect-border-width": `${borderWidth}px`,
              "--repeating-conic-gradient-times": "5",
              "--gradient":
                variant === "white"
                  ? `radial-gradient(circle, hsl(var(--primary)) 10%, hsl(var(--primary) / 0) 20%),
                radial-gradient(circle at 40% 40%, hsl(var(--primary)) 5%, hsl(var(--primary) / 0) 15%),
                radial-gradient(circle at 60% 60%, hsl(var(--primary)) 10%, hsl(var(--primary) / 0) 20%), 
                radial-gradient(circle at 40% 60%, hsl(var(--primary)) 10%, hsl(var(--primary) / 0) 20%),
                repeating-conic-gradient(
                  from 236.84deg at 50% 50%,
                  hsl(var(--primary)) 0%,
                  hsl(var(--primary) / 0.8) calc(25% / var(--repeating-conic-gradient-times)),
                  hsl(var(--primary) / 0.6) calc(50% / var(--repeating-conic-gradient-times)), 
                  hsl(var(--primary) / 0.8) calc(75% / var(--repeating-conic-gradient-times)),
                  hsl(var(--primary)) calc(100% / var(--repeating-conic-gradient-times))
                )`
                  : `radial-gradient(circle, #dd7bbb 10%, #dd7bbb00 20%),
                radial-gradient(circle at 40% 40%, #d79f1e 5%, #d79f1e00 15%),
                radial-gradient(circle at 60% 60%, #5a922c 10%, #5a922c00 20%), 
                radial-gradient(circle at 40% 60%, #4c7894 10%, #4c789400 20%),
                repeating-conic-gradient(
                  from 236.84deg at 50% 50%,
                  #dd7bbb 0%,
                  #d79f1e calc(25% / var(--repeating-conic-gradient-times)),
                  #5a922c calc(50% / var(--repeating-conic-gradient-times)), 
                  #4c7894 calc(75% / var(--repeating-conic-gradient-times)),
                  #dd7bbb calc(100% / var(--repeating-conic-gradient-times))
                )`,
            } as React.CSSProperties
          }
          className={cn(
            "pointer-events-none absolute inset-0 rounded-[inherit] opacity-100 transition-opacity",
            glow && "opacity-100",
            blur > 0 && "blur-[var(--blur)] ",
            className,
            disabled && "!hidden"
          )}
        >
          <div
            className={cn(
              "glow",
              "rounded-[inherit]",
              'after:content-[""] after:rounded-[inherit] after:absolute after:inset-[calc(-1*var(--glowingeffect-border-width))]',
              "after:[border:var(--glowingeffect-border-width)_solid_transparent]",
              "after:[background:var(--gradient)] after:[background-attachment:fixed]",
              "after:opacity-[var(--active)] after:transition-opacity after:duration-300",
              "after:[mask-clip:padding-box,border-box]",
              "after:[mask-composite:intersect]",
              "after:[mask-image:linear-gradient(#0000,#0000),conic-gradient(from_calc((var(--start)-var(--spread))*1deg),#00000000_0deg,#fff,#00000000_calc(var(--spread)*2deg))]"
            )}
          />
        </div>
      </>
    );
  }
);

GlowingEffect.displayName = "GlowingEffect";

// Spotlight effect component
type SpotlightProps = {
  gradientFirst?: string;
  gradientSecond?: string;
  gradientThird?: string;
  translateY?: number;
  width?: number;
  height?: number;
  smallWidth?: number;
  duration?: number;
  xOffset?: number;
};

const Spotlight = ({
  gradientFirst = "radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(210, 100%, 85%, .08) 0, hsla(210, 100%, 55%, .02) 50%, hsla(210, 100%, 45%, 0) 80%)",
  gradientSecond = "radial-gradient(50% 50% at 50% 50%, hsla(210, 100%, 85%, .06) 0, hsla(210, 100%, 55%, .02) 80%, transparent 100%)",
  gradientThird = "radial-gradient(50% 50% at 50% 50%, hsla(210, 100%, 85%, .04) 0, hsla(210, 100%, 45%, .02) 80%, transparent 100%)",
  translateY = -350,
  width = 560,
  height = 1380,
  smallWidth = 240,
  duration = 7,
  xOffset = 100,
}: SpotlightProps = {}) => {
  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      transition={{
        duration: 1.5,
      }}
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <motion.div
        animate={{
          x: [0, xOffset, 0],
        }}
        transition={{
          duration,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
        className="absolute top-0 left-0 w-screen h-screen z-40 pointer-events-none"
      >
        <div
          style={{
            transform: `translateY(${translateY}px) rotate(-45deg)`,
            background: gradientFirst,
            width: `${width}px`,
            height: `${height}px`,
          }}
          className={`absolute top-0 left-0`}
        />

        <div
          style={{
            transform: "rotate(-45deg) translate(5%, -50%)",
            background: gradientSecond,
            width: `${smallWidth}px`,
            height: `${height}px`,
          }}
          className={`absolute top-0 left-0 origin-top-left`}
        />

        <div
          style={{
            transform: "rotate(-45deg) translate(-180%, -70%)",
            background: gradientThird,
            width: `${smallWidth}px`,
            height: `${height}px`,
          }}
          className={`absolute top-0 left-0 origin-top-left`}
        />
      </motion.div>

      <motion.div
        animate={{
          x: [0, -xOffset, 0],
        }}
        transition={{
          duration,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
        className="absolute top-0 right-0 w-screen h-screen z-40 pointer-events-none"
      >
        <div
          style={{
            transform: `translateY(${translateY}px) rotate(45deg)`,
            background: gradientFirst,
            width: `${width}px`,
            height: `${height}px`,
          }}
          className={`absolute top-0 right-0`}
        />

        <div
          style={{
            transform: "rotate(45deg) translate(-5%, -50%)",
            background: gradientSecond,
            width: `${smallWidth}px`,
            height: `${height}px`,
          }}
          className={`absolute top-0 right-0 origin-top-right`}
        />

        <div
          style={{
            transform: "rotate(45deg) translate(180%, -70%)",
            background: gradientThird,
            width: `${smallWidth}px`,
            height: `${height}px`,
          }}
          className={`absolute top-0 right-0 origin-top-right`}
        />
      </motion.div>
    </motion.div>
  );
};

// Enhanced Typewriter effect component with instant word switching
const TypewriterText = ({ 
  texts, 
  className = "", 
  speed = 100, 
  delay = 0,
  cursor = true
}: { 
  texts: string[]; 
  className?: string; 
  speed?: number; 
  delay?: number;
  cursor?: boolean;
}) => {
  const [displayText, setDisplayText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [textIndex, setTextIndex] = useState(0)

  useEffect(() => {
    if (!texts.length) return

    const currentText = texts[textIndex]
    
    // Typing text
    if (currentIndex < currentText.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + currentText[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, speed)
      return () => clearTimeout(timeout)
    } else {
      // Finished typing, wait then instantly switch to next text
      const pauseTimeout = setTimeout(() => {
        setTextIndex(prev => (prev + 1) % texts.length)
        setCurrentIndex(0)
        setDisplayText("")
      }, 1000) // Pause for 1 second before switching
      return () => clearTimeout(pauseTimeout)
    }
  }, [currentIndex, textIndex, texts, speed])

  useEffect(() => {
    const initialDelay = setTimeout(() => {
      setCurrentIndex(0)
      setDisplayText("")
      setTextIndex(0)
    }, delay)
    return () => clearTimeout(initialDelay)
  }, [delay])

  return (
    <span className={className}>
      {displayText}
      {cursor && (
        <span className="animate-pulse text-primary">|</span>
      )}
    </span>
  )
}

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background py-24 sm:py-32">
      {/* Spotlight effect */}
      <Spotlight />
      
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Secure Your Smart Contracts with{" "}
              <span className="inline-block min-w-[400px] sm:min-w-[500px] lg:min-w-[600px]">
                <TypewriterText 
                  texts={[
                    "AI-Powered Analysis",
                    "Slither Detection",
                    "Mythril Analysis", 
                    "Echidna Testing",
                    "Formal Verification",
                    "Symbolic Execution",
                    "Fuzzing Analysis",
                    "Static Analysis"
                  ]}
                  speed={80}
                  delay={500}
                  className="text-primary"
                />
              </span>
            </h1>
            <motion.p 
              className="mt-6 text-lg leading-8 text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              Comprehensive web3 security platform that combines traditional static analysis 
              with cutting-edge AI to detect vulnerabilities before they become exploits.
            </motion.p>
            <motion.div 
              className="mt-10 flex items-center justify-center gap-x-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              <Button asChild size="lg" className="group">
                <Link href="/scanner">
                  Start Scanning
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/services">View Services</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Partners Logos Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.6 }}
          className="mx-auto mt-16 max-w-4xl px-4"
        >
          <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-6 lg:gap-10 opacity-60 flex-wrap">
            {/* Partner logos */}
            <Image src="/partners/Slither.png" alt="Slither" width={56} height={40} className="h-8 w-auto sm:h-12 md:h-16 lg:h-20" />
            <Image src="/partners/Mythril.png" alt="Mythril" width={56} height={40} className="h-8 w-auto sm:h-12 md:h-16 lg:h-20" />
            <Image src="/partners/Echidna.png" alt="Echidna" width={56} height={40} className="h-8 w-auto sm:h-12 md:h-16 lg:h-20" />
            <Image src="/partners/Manticore.png" alt="Manticore" width={56} height={40} className="h-8 w-auto sm:h-12 md:h-16 lg:h-20" />
            <div className="h-8 sm:h-12 md:h-16 lg:h-20 flex items-center justify-center">
              <span className="text-sm sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-500">Oyente</span>
            </div>
            <Image src="/partners/Securify.png" alt="Securify" width={56} height={48} className="h-8 w-auto sm:h-12 md:h-16 lg:h-20" />
            <Image src="/partners/OpenAI.png" alt="OpenAI" width={56} height={80} className="h-8 w-auto sm:h-12 md:h-16 lg:h-20" />
          </div>
        </motion.div>

        {/* Scanner Preview Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2.0 }}
          className="mx-auto mt-20 max-w-6xl"
        >
          <div className="relative">
            {/* Top, left, and right glows behind the screenshot frame */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-[90%] h-24 bg-primary/30 rounded-full blur-2xl z-0 pointer-events-none" />
            <div className="absolute top-1/2 -translate-y-1/2 -left-8 w-16 h-[80%] bg-primary/20 rounded-full blur-2xl z-0 pointer-events-none" />
            <div className="absolute top-1/2 -translate-y-1/2 -right-8 w-16 h-[80%] bg-primary/20 rounded-full blur-2xl z-0 pointer-events-none" />
            {/* Top left and right corner glows */}
            <div className="absolute -top-6 -left-6 w-16 h-16 bg-primary/30 rounded-full blur-2xl z-0 pointer-events-none" />
            <div className="absolute -top-6 -right-6 w-16 h-16 bg-primary/30 rounded-full blur-2xl z-0 pointer-events-none" />
            <div className="relative mx-auto max-w-5xl">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl z-10">
                <Image
                  src="/scanner-preview.png"
                  alt="Scanner Preview"
                  className="w-full h-auto rounded-2xl"
                  width={1200}
                  height={800}
                />
                {/* Stronger and higher faded bottom overlay */}
                <div className="pointer-events-none absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[calc(50%-4rem)] top-10 -z-10 transform-gpu blur-3xl sm:left-[calc(50%-18rem)] lg:left-48 lg:top-[calc(50%-30rem)] xl:left-[calc(50%-24rem)]">
          <div className="aspect-[1108/632] w-[69.25rem] bg-gradient-to-r from-primary/20 to-transparent opacity-20" />
        </div>
      </div>
    </section>
  )
}

export { Spotlight }; 