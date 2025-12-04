import { chainsSvgs } from 'assets'
import { IWeb3ChainType, IWeb3NetworkType } from '../../type'
import { lineaSepolia } from '@wagmi/core/chains'

const icon = chainsSvgs.lineaSvg
const networkType: IWeb3NetworkType = 'test'

const chainInfo: IWeb3ChainType = {
  chain: lineaSepolia,
  id: 59_141,
  type: 'EVM',
  name: lineaSepolia.name,
  icon: icon,
  networkType
}

export default chainInfo
