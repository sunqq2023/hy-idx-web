import { chainsSvgs } from 'assets'
import { IWeb3ChainType, IWeb3NetworkType } from '../../type'
import { mainnet } from '@wagmi/core/chains'

const icon = chainsSvgs.ethSvg
const networkType: IWeb3NetworkType = 'main'

const chainInfo: IWeb3ChainType = {
  chain: {
    ...mainnet,
    rpcUrls: {
      default: {
        http: [
          'https://eth-mainnet.g.alchemy.com/v2/DR7Jtd4NSYTtAY7Heme8ml-j6oBCZgGO'
        ]
      }
    }
  },
  id: 1,
  type: 'EVM',
  name: mainnet.name,
  icon: icon,
  networkType
}

export default chainInfo
