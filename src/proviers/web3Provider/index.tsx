import React, { PropsWithChildren } from 'react'
import { WagmiProvider } from 'wagmi'
import { evmChainsConfig } from './chains'

const Provider = ({ children }: PropsWithChildren) => {
  const config = evmChainsConfig()
  return <WagmiProvider config={config}>{children}</WagmiProvider>
}

export default Provider
