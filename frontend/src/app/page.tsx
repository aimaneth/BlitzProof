import { Layout } from "@/components/layout/layout"
import { Hero } from "@/components/sections/hero"
import { Features } from "@/components/sections/Features"
import { Stats } from "@/components/sections/Stats"
import { BottomCTA } from "@/components/sections/BottomCTA"
import { SupportedNetworks } from "@/components/sections/SupportedNetworks"

export default function Home() {
  return (
    <Layout>
      <Hero />
      <Features />
      <Stats />
      <SupportedNetworks />
      <BottomCTA />
    </Layout>
  )
}
