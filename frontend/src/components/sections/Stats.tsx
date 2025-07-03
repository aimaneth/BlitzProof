import { Card, CardContent } from '@/components/ui/card'

export function Stats() {
    return (
        <section className="bg-zinc-50 py-16 md:py-32 dark:bg-transparent">
            <div className="mx-auto max-w-2xl px-6 lg:max-w-5xl">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-semibold mb-4">Trusted by Developers Worldwide</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Our platform has processed millions of smart contracts, helping secure the future of decentralized applications.
                    </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        number="50K+"
                        label="Smart Contracts Scanned"
                        description="Advanced AI analysis across multiple blockchain networks"
                    />
                    <StatCard
                        number="2.5K+"
                        label="Vulnerabilities Detected"
                        description="Critical security issues identified and prevented"
                    />
                    <StatCard
                        number="99.8%"
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
        <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold text-primary mb-2 group-hover:text-primary/80 transition-colors">
                {number}
            </div>
            <div className="text-lg font-medium mb-3">{label}</div>
            <div className="text-sm text-muted-foreground">{description}</div>
            <div className="mt-4 h-1 bg-gradient-to-r from-primary/40 to-primary/20 rounded-full"></div>
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