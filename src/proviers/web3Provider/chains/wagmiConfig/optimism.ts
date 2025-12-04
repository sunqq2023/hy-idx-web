import { chainsSvgs } from 'assets'
import { IWeb3ChainType, IWeb3NetworkType } from '../../type'
import { optimism } from '@wagmi/core/chains'

const icon = chainsSvgs.opSvg
const networkType: IWeb3NetworkType = 'main'

const chainInfo: IWeb3ChainType = {
  chain: {
    ...optimism,
    rpcUrls: {
      default: {
        http: [
          'https://opt-mainnet.g.alchemy.com/v2/DR7Jtd4NSYTtAY7Heme8ml-j6oBCZgGO'
        ]
      }
    }
  },
  id: 10,
  type: 'EVM',
  name: 'Optimism',
  icon: icon,
  networkType
}

export default chainInfo
