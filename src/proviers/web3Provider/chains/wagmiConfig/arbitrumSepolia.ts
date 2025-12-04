import { chainsSvgs } from 'assets'
import { IWeb3ChainType, IWeb3NetworkType } from '../../type'
import { arbitrumSepolia } from '@wagmi/core/chains'

const icon = chainsSvgs.arbJpeg
const networkType: IWeb3NetworkType = 'test'

const chainInfo: IWeb3ChainType = {
  chain: arbitrumSepolia,
  id: 421_614,
  type: 'EVM',
  name: arbitrumSepolia.name,
  icon: icon,
  networkType
}

export default chainInfo
