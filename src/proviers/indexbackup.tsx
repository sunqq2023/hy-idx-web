import { PropsWithChildren } from 'react'
import { projectId, networks, wagmiAdapter } from './config'
import { createAppKit } from '@reown/appkit/react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
const queryClient = new QueryClient()

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  features: {
    email: false,
    socials: []
  },
  themeMode: 'light' as const,
  themeVariables: {
    '--w3m-accent': '#000000'
  },
  allWallets: 'ONLY_MOBILE'
})

const Proviers = ({ children }: PropsWithChildren) => {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}

export default Proviers
