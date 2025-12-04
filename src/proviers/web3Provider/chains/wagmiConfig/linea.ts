import { chainsSvgs } from 'assets'
import { IWeb3ChainType, IWeb3NetworkType } from '../../type'
import { linea } from '@wagmi/core/chains'

const icon = chainsSvgs.lineaSvg
const networkType: IWeb3NetworkType = 'main'

const chainInfo: IWeb3ChainType = {
  chain: {
    ...linea,
    rpcUrls: {
      default: {
        http: [
          'https://linea-mainnet.infura.io/v3/e42637ee1f664cad93e70bbf62196769'
        ]
      }
    }
  },
  id: 59_144,
  type: 'EVM',
  name: 'Linea',
  icon: icon,
  networkType
}

export default chainInfo
