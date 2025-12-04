import { chainsSvgs } from 'assets'
import { IWeb3ChainType, IWeb3NetworkType } from '../../type'
import { sepolia } from '@wagmi/core/chains'

const icon = chainsSvgs.ethSvg
const networkType: IWeb3NetworkType = 'test'

const chainInfo: IWeb3ChainType = {
  chain: sepolia,
  id: 11_155_111,
  type: 'EVM',
  name: sepolia.name,
  icon: icon,
  networkType
}

export default chainInfo
