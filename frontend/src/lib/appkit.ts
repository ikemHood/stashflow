import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, polygon, optimism, arbitrum, base, sepolia } from '@reown/appkit/networks'

const projectId = import.meta.env.VITE_PROJECT_ID

// 2. Create a metadata object
const metadata = {
    name: 'Stashflow',
    description: 'Crypto Savings App',
    url: 'https://stashflow.app', // origin must match your domain & subdomain
    icons: ['/assets/logo.svg']
}

// 3. Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
    networks: [mainnet, polygon, optimism, arbitrum, base, sepolia],
    projectId,
    ssr: false
})

// 4. Create modal
createAppKit({
    adapters: [wagmiAdapter],
    networks: [sepolia],
    projectId,
    metadata,
    features: {
        analytics: true
    }
}) 