import { chainsSvgs } from 'assets'
import { IWeb3ChainType, IWeb3NetworkType } from '../../type'

const chain = {
  id: 501,
  name: 'SOL',
  nativeCurrency: {
    decimals: 9,
    name: 'SOL',
    symbol: 'SOL'
  }
}
const icon = chainsSvgs.solSvg
const networkType: IWeb3NetworkType = 'main'

const chainInfo: IWeb3ChainType = {
  chain: chain as any,
  id: 501,
  type: 'SOL',
  name: 'Solana',
  icon: icon,
  networkType
}

export default chainInfo
