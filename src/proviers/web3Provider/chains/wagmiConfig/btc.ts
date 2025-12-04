import { chainsSvgs } from 'assets'
import { IWeb3ChainType, IWeb3NetworkType } from '../../type'

const icon = chainsSvgs.btcSvg
const networkType: IWeb3NetworkType = 'main'

const chainInfo: IWeb3ChainType = {
  chain: {
    id: 0,
    name: 'BTC',
    nativeCurrency: { decimals: 8, name: 'BTC', symbol: 'BTC' }
  },
  id: 0,
  type: 'BTC',
  name: 'Bitcoin',
  icon: icon,
  networkType
}

export default chainInfo
