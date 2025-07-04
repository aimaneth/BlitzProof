import Image from 'next/image'

const allNetworks = [
  { id: "ethereum", name: "Ethereum", icon: "/networks/ethereum.png" },
  { id: "polygon", name: "Polygon", icon: "/networks/polygon.png" },
  { id: "bsc", name: "BSC", icon: "/networks/bsc.png" },
  { id: "arbitrum", name: "Arbitrum", icon: "/networks/arbitrum.png" },
  { id: "optimism", name: "Optimism", icon: "/networks/optimism.png" },
  { id: "avalanche", name: "Avalanche", icon: "/networks/avalanche.png" },
  { id: "fantom", name: "Fantom", icon: "/networks/fantom.png" },
  { id: "base", name: "Base", icon: "/networks/base.png" },
  { id: "linea", name: "Linea", icon: "/networks/linea.png" },
  { id: "zksync", name: "zkSync", icon: "/networks/zksync.png" },
  { id: "scroll", name: "Scroll", icon: "/networks/scroll.png" },
  { id: "mantle", name: "Mantle", icon: "/networks/mantle.png" },
  { id: "celo", name: "Celo", icon: "/networks/celo.png" },
  { id: "gnosis", name: "Gnosis", icon: "/networks/gnosis.png" },
  { id: "moonbeam", name: "Moonbeam", icon: "/networks/moonbeam.png" },
  { id: "harmony", name: "Harmony", icon: "/networks/harmony.png" },
  { id: "cronos", name: "Cronos", icon: "/networks/cronos.png" },
  { id: "klaytn", name: "Klaytn", icon: "/networks/klaytn.png" },
  { id: "metis", name: "Metis", icon: "/networks/metis.png" },
  { id: "boba", name: "Boba", icon: "/networks/boba.png" }
]



export function SupportedNetworks() {
  return (
    <section className="py-12 sm:py-16 px-4 bg-black/20">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-6 text-foreground">Supported Networks</h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
            Secure your smart contracts across the most popular blockchain networks
          </p>
        </div>
        
        {/* Logo Carousel - Seamless Infinite Loop */}
        <div className="relative overflow-hidden">
          {/* Left fade gradient */}
          <div className="absolute left-0 top-0 w-16 sm:w-32 lg:w-48 h-full bg-gradient-to-r from-black via-black/90 to-transparent z-10 pointer-events-none"></div>
          
          {/* Right fade gradient */}
          <div className="absolute right-0 top-0 w-16 sm:w-32 lg:w-48 h-full bg-gradient-to-l from-black via-black/90 to-transparent z-10 pointer-events-none"></div>
          
          {/* Carousel Container */}
          <div className="flex animate-seamless-scroll">
            {/* First set of logos */}
            {allNetworks.map((network) => (
              <div key={network.id} className="flex-shrink-0 mx-2 sm:mx-4">
                <Image 
                  src={network.icon} 
                  alt={`${network.name} logo`}
                  width={48}
                  height={48}
                  className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full object-cover shadow-lg hover:scale-110 transition-transform duration-300 filter-grayscale brightness-50"
                />
              </div>
            ))}
            {/* Second set for seamless loop */}
            {allNetworks.map((network) => (
              <div key={`${network.id}-duplicate-1`} className="flex-shrink-0 mx-2 sm:mx-4">
                <Image 
                  src={network.icon} 
                  alt={`${network.name} logo`}
                  width={48}
                  height={48}
                  className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full object-cover shadow-lg hover:scale-110 transition-transform duration-300 filter-grayscale brightness-50"
                />
              </div>
            ))}
            {/* Third set for extra smoothness */}
            {allNetworks.map((network) => (
              <div key={`${network.id}-duplicate-2`} className="flex-shrink-0 mx-2 sm:mx-4">
                <Image 
                  src={network.icon} 
                  alt={`${network.name} logo`}
                  width={48}
                  height={48}
                  className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full object-cover shadow-lg hover:scale-110 transition-transform duration-300 filter-grayscale brightness-50"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
} 