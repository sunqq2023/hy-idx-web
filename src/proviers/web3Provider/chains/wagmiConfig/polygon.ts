import { chainsSvgs } from 'assets'
import { IWeb3ChainType, IWeb3NetworkType } from '../../type'
import { polygon } from '@wagmi/core/chains'

const icon = chainsSvgs.polygonSvg
const networkType: IWeb3NetworkType = 'main'

const chainInfo: IWeb3ChainType = {
  chain: {
    ...polygon,
    rpcUrls: {
      default: {
        http: [
          'https://rpc.ankr.com/polygon/c2d7e8a3db5dce62e202db3d28cca25e74da5028abbf20764e2961918ba34dfc'
        ]
      }
    }
  },
  id: 137,
  type: 'EVM',
  name: polygon.name,
  icon: icon,
  networkType
}

export default chainInfo
