import { chainsSvgs } from 'assets'
import { IWeb3ChainType, IWeb3NetworkType } from '../../type'
import { baseSepolia } from '@wagmi/core/chains'

const icon = chainsSvgs.baseSvg
const networkType: IWeb3NetworkType = 'test'

const chainInfo: IWeb3ChainType = {
  chain: baseSepolia,
  id: 84532,
  type: 'EVM',
  name: baseSepolia.name,
  icon: icon,
  networkType
}

export default chainInfo
