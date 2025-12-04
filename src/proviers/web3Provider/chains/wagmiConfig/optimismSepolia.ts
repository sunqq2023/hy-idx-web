import { chainsSvgs } from 'assets'
import { IWeb3ChainType, IWeb3NetworkType } from '../../type'
import { optimismSepolia } from '@wagmi/core/chains'

const icon = chainsSvgs.opSvg
const networkType: IWeb3NetworkType = 'test'

const chainInfo: IWeb3ChainType = {
  chain: optimismSepolia,
  id: 11155420,
  type: 'EVM',
  name: optimismSepolia.name,
  icon: icon,
  networkType
}

export default chainInfo
