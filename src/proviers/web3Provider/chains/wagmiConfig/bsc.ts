import { chainsSvgs } from 'assets'
import { IWeb3ChainType, IWeb3NetworkType } from '../../type'
import { bsc } from '@wagmi/core/chains'

const icon = chainsSvgs.bscSvg
const networkType: IWeb3NetworkType = 'main'

const chainInfo: IWeb3ChainType = {
  chain: {
    ...bsc,
    rpcUrls: {
      default: {
        http: [
          'https://rpc.ankr.com/bsc/ac79e83cf02a544dbb9b3f4c5d5478b2510b921e7d5739ded8791a932e8de0a6'
        ]
      }
    }
  },
  id: 56,
  type: 'EVM',
  name: 'BNB Chain',
  icon: icon,
  networkType
}

export default chainInfo
