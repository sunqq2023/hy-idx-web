import '@rainbow-me/rainbowkit/styles.css'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { PropsWithChildren } from 'react'
import BaseQueryClientProvider from './QueryClientProvider'
import config from './config'

const Proviers = ({ children }: PropsWithChildren) => {
  return (
    <WagmiProvider config={config}>
      <BaseQueryClientProvider>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </BaseQueryClientProvider>
    </WagmiProvider>
  )
}

export default Proviers
