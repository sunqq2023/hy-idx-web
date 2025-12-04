import { chainsSvgs } from 'assets'
import { IWeb3ChainType, IWeb3NetworkType } from '../../type'

const icon = chainsSvgs.tronChainSvg
const networkType: IWeb3NetworkType = 'main'

const chainInfo: IWeb3ChainType = {
  chain: {
    id: 19484,
    name: 'TRON',
    nativeCurrency: { decimals: 6, name: 'TRON', symbol: 'TRON' }
  },
  id: 19484,
  type: 'TRON',
  name: 'TRON',
  icon: icon,
  networkType
}

export default chainInfo
