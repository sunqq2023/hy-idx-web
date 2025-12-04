import { chainsSvgs } from 'assets'
import { IWeb3ChainType, IWeb3NetworkType } from '../../type'
import { base } from '@wagmi/core/chains'

const icon = chainsSvgs.baseSvg
const networkType: IWeb3NetworkType = 'main'

const chainInfo: IWeb3ChainType = {
  chain: {
    ...base,
    rpcUrls: {
      default: {
        http: [
          'https://base-mainnet.g.alchemy.com/v2/DR7Jtd4NSYTtAY7Heme8ml-j6oBCZgGO'
        ]
      }
    }
  },
  id: 8453,
  type: 'EVM',
  name: base.name,
  icon: icon,
  networkType
}

export default chainInfo
