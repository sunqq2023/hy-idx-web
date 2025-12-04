import { chainsSvgs } from 'assets'
import { IWeb3ChainType, IWeb3NetworkType } from '../../type'

const icon = chainsSvgs.tonSvg
const networkType: IWeb3NetworkType = 'main'

const chainInfo: IWeb3ChainType = {
  chain: {
    id: 1100,
    name: 'TON',
    nativeCurrency: { decimals: 9, name: 'TON', symbol: 'TON' }
  },
  id: 1100,
  type: 'TON',
  name: 'TON',
  icon: icon,
  networkType
}

export default chainInfo
