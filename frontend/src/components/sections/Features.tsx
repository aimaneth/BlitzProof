import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Calendar, LucideIcon, MapIcon } from 'lucide-react'
import { ReactNode } from 'react'
import Image from 'next/image'

export function Features() {
    return (
        <section className="bg-background py-12 sm:py-16 md:py-32">
            <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:max-w-5xl">
                <div className="mx-auto grid gap-4 lg:grid-cols-2">
                    <FeatureCard>
                        <CardHeader className="pb-3">
                            <CardHeading
                                icon={MapIcon}
                                title="Smart Contract Scanning"
                                description="Advanced AI-powered scanning system, instantly detect vulnerabilities in your smart contracts."
                            />
                        </CardHeader>

                        <div className="relative mb-6 border-t border-dashed sm:mb-0">
                            <div className="absolute inset-0 [background:radial-gradient(125%_125%_at_50%_0%,transparent_40%,hsl(var(--primary)/0.6),white_125%)]"></div>
                            <div className="aspect-[76/59] p-1 px-6 rounded-t-lg overflow-hidden">
                                <DualModeImage
                                    darkSrc="/features/scan.png"
                                    alt="smart contract scanning illustration"
                                    width={1207}
                                    height={929}
                                />
                            </div>
                        </div>
                    </FeatureCard>

                    <FeatureCard>
                        <CardHeader className="pb-3">
                            <CardHeading
                                icon={Calendar}
                                title="Real-time Monitoring"
                                description="Continuous surveillance system, monitor your contracts 24/7 with instant alerts."
                            />
                        </CardHeader>

                        <CardContent>
                            <div className="relative mb-6 sm:mb-0">
                                <div className="aspect-[4/3] border overflow-hidden">
                                    <DualModeImage
                                        darkSrc="/features/monitoring.png"
                                        alt="real-time monitoring illustration"
                                        width={1207}
                                        height={929}
                                        className="scale-110"
                                    />
                                    <div className="absolute inset-0 [background:radial-gradient(80%_80%_at_30%_50%,transparent,black_95%)] pointer-events-none"></div>
                                </div>
                            </div>
                        </CardContent>
                    </FeatureCard>

                    <FeatureCard className="p-4 sm:p-6 lg:col-span-2">
                        <p className="mx-auto my-4 sm:my-6 max-w-md text-balance text-center text-lg sm:text-xl lg:text-2xl font-semibold px-4">Multi-tool integration with leading security frameworks.</p>

                        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 overflow-hidden px-4">
                            <CircularUI
                                label="Slither"
                                circles={[{ pattern: 'border' }, { pattern: 'border' }]}
                            />

                            <CircularUI
                                label="Mythril"
                                circles={[{ pattern: 'none' }, { pattern: 'primary' }]}
                            />

                            <CircularUI
                                label="Securify"
                                circles={[{ pattern: 'blue' }, { pattern: 'none' }]}
                            />

                            <CircularUI
                                label="Echidna"
                                circles={[{ pattern: 'primary' }, { pattern: 'none' }]}
                                className="hidden sm:block"
                            />
                        </div>
                    </FeatureCard>
                </div>
            </div>
        </section>
    )
}

interface FeatureCardProps {
    children: ReactNode
    className?: string
}

const FeatureCard = ({ children, className }: FeatureCardProps) => (
    <Card className={cn('group relative rounded-none shadow-zinc-950/5 bg-black/50 dark:bg-black/50', className)}>
        <CardDecorator />
        {children}
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

interface CardHeadingProps {
    icon: LucideIcon
    title: string
    description: string
}

const CardHeading = ({ icon: Icon, title, description }: CardHeadingProps) => (
    <div className="p-4 sm:p-6">
        <span className="text-muted-foreground flex items-center gap-2 text-sm sm:text-base">
            <Icon className="size-4" />
            {title}
        </span>
        <p className="mt-6 sm:mt-8 text-lg sm:text-xl lg:text-2xl font-semibold">{description}</p>
    </div>
)

interface DualModeImageProps {
    darkSrc: string
    alt: string
    width: number
    height: number
    className?: string
}

const DualModeImage = ({ darkSrc, alt, width, height, className }: DualModeImageProps) => (
    <Image
        src={darkSrc}
        className={cn('rounded-t-lg object-cover object-[-20%_0%] w-full h-full', className)}
        alt={alt}
        width={width}
        height={height}
    />
)

interface CircleConfig {
    pattern: 'none' | 'border' | 'primary' | 'blue'
}

interface CircularUIProps {
    label: string
    circles: CircleConfig[]
    className?: string
}

const CircularUI = ({ label, circles, className }: CircularUIProps) => (
    <div className={className}>
        <div className="bg-gradient-to-b from-border size-fit rounded-2xl to-transparent p-px">
            <div className="bg-gradient-to-b from-background to-muted/25 relative flex aspect-square w-fit items-center -space-x-4 rounded-[15px] p-4">
                {circles.map((circle, i) => (
                    <div
                        key={i}
                        className={cn('size-7 rounded-full border sm:size-8', {
                            'border-primary': circle.pattern === 'none',
                            'border-primary bg-[repeating-linear-gradient(-45deg,hsl(var(--border)),hsl(var(--border))_1px,transparent_1px,transparent_4px)]': circle.pattern === 'border',
                            'border-primary bg-background bg-[repeating-linear-gradient(-45deg,hsl(var(--primary)),hsl(var(--primary))_1px,transparent_1px,transparent_4px)]': circle.pattern === 'primary',
                            'bg-background z-1 border-blue-500 bg-[repeating-linear-gradient(-45deg,theme(colors.blue.500),theme(colors.blue.500)_1px,transparent_1px,transparent_4px)]': circle.pattern === 'blue',
                        })}></div>
                ))}
            </div>
        </div>
        <span className="text-muted-foreground mt-1.5 block text-center text-sm">{label}</span>
    </div>
) 