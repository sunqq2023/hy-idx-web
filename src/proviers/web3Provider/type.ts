import * as wagmiChains from 'wagmi/chains'
import chains from './chains'

export type IChainType = (typeof wagmiChains)[keyof typeof wagmiChains]

export type IChainName<T extends keyof typeof wagmiChains> =
  (typeof wagmiChains)[T]['name']

export type IChainId =
  | IChainType['id']
  | typeof chains.allChain.id
  | typeof chains.ton.id
  | typeof chains.btc.id
  | typeof chains.solana.id
  | typeof chains.tron.id

export type Address = `0x${string}`

export type IWeb3Type = 'EVM' | 'SOL' | 'BTC' | 'SUI' | 'ALL' | 'TON' | 'TRON'

export enum Web3Type {
  'EVM' = 'EVM',
  'SOL' = 'SOL',
  'BTC' = 'BTC',
  'SUI' = 'SUI',
  'TON' = 'TON',
  'TRON' = 'TRON',
  'ALL' = 'ALL'
}

export type IWeb3NetworkType = 'main' | 'test' | 'custom'

export type IWeb3ChainType = {
  id: number
  type: IWeb3Type
  icon: string
  name: string
  networkType: IWeb3NetworkType
  chain?: IChainType
}
