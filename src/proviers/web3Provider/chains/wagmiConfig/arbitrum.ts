import { chainsSvgs } from 'assets'
import { IWeb3ChainType, IWeb3NetworkType } from '../../type'
import { arbitrum } from '@wagmi/core/chains'

const icon = chainsSvgs.arbJpeg
const networkType: IWeb3NetworkType = 'main'

const chainInfo: IWeb3ChainType = {
  chain: {
    ...arbitrum,
    rpcUrls: {
      default: {
        http: [
          'https://arb-mainnet.g.alchemy.com/v2/DR7Jtd4NSYTtAY7Heme8ml-j6oBCZgGO'
        ]
      }
    }
  },
  id: 42_161,
  type: 'EVM',
  name: arbitrum.name,
  icon: icon,
  networkType: networkType
}

export default chainInfo
