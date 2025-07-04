import { Card, CardContent } from '@/components/ui/card'

export function BottomCTA() {
    return (
        <section className="bg-background py-12 sm:py-16 md:py-32">
            <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:max-w-5xl">
                <Card className="group relative rounded-none shadow-zinc-950/5 bg-gradient-to-br from-black/60 via-black/40 to-black/80 dark:from-black/60 dark:via-black/40 dark:to-black/80 border border-white/10 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5"></div>
                    <div className="absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_0%,rgba(255,255,255,0.02)_100%)]"></div>
                    <CardDecorator />
                    <CardContent className="p-6 sm:p-8 text-center relative z-10">
                        <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Ready to Secure Your Smart Contracts?</h3>
                        <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-2xl mx-auto px-4">
                            Join thousands of developers who trust our advanced scanning technology to protect their blockchain applications.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                            <button className="px-6 sm:px-8 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors text-sm sm:text-base">
                                Start Scanning Now
                            </button>
                            <button className="px-6 sm:px-8 py-2.5 sm:py-3 border border-white/20 text-white rounded-lg font-medium hover:bg-white/5 transition-colors text-sm sm:text-base">
                                View Documentation
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>
    )
}

const CardDecorator = () => (
    <>
        <span className="border-primary absolute -left-px -top-px block size-2 border-l-2 border-t-2"></span>
        <span className="border-primary absolute -right-px -top-px block size-2 border-r-2 border-t-2"></span>
        <span className="border-primary absolute -bottom-px -left-px block size-2 border-b-2 border-l-2"></span>
        <span className="border-primary absolute -bottom-px -right-px block size-2 border-b-2 border-r-2"></span>
    </>
) 