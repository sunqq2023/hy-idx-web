import { chainsSvgs } from 'assets'
import { IWeb3ChainType, IWeb3NetworkType } from '../../type'
import { blast } from '@wagmi/core/chains'

const icon = chainsSvgs.blastSvg
const networkType: IWeb3NetworkType = 'main'

const chainInfo: IWeb3ChainType = {
  chain: {
    ...blast,
    rpcUrls: {
      default: {
        http: [
          'https://rpc.ankr.com/blast/1c6f7bcdfedae95506790bceca4c0fe9b0b635ce555fd412413ce500b8d572f9'
        ]
      }
    }
  },
  id: 81457,
  type: 'EVM',
  name: blast.name,
  icon: icon,
  networkType
}

export default chainInfo
