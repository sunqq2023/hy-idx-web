import { chainsSvgs } from 'assets'
import { IWeb3ChainType, IWeb3NetworkType } from '../../type'
import { avalanche } from '@wagmi/core/chains'

const icon = chainsSvgs.avaxSvg
const networkType: IWeb3NetworkType = 'main'

const chainInfo: IWeb3ChainType = {
  chain: {
    ...avalanche,
    rpcUrls: {
      default: {
        http: [
          'https://rpc.ankr.com/avalanche/c2d7e8a3db5dce62e202db3d28cca25e74da5028abbf20764e2961918ba34dfc'
        ]
      }
    }
  },
  id: 43_114,
  type: 'EVM',
  name: avalanche.name,
  icon: icon,
  networkType
}

export default chainInfo
