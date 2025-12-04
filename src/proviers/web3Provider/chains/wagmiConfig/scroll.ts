import { chainsSvgs } from 'assets'
import { IWeb3ChainType, IWeb3NetworkType } from '../../type'
import { scroll } from '@wagmi/core/chains'

const icon = chainsSvgs.scrollSvg
const networkType: IWeb3NetworkType = 'main'

const chainInfo: IWeb3ChainType = {
  chain: {
    ...scroll,
    rpcUrls: {
      default: {
        http: [
          'https://rpc.ankr.com/scroll/c2d7e8a3db5dce62e202db3d28cca25e74da5028abbf20764e2961918ba34dfc'
        ]
      }
    }
  },
  id: 534_352,
  type: 'EVM',
  name: scroll.name,
  icon: icon,
  networkType
}

export default chainInfo
