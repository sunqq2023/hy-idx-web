import { chainsSvgs } from 'assets'
import { IWeb3ChainType, IWeb3NetworkType } from '../../type'
import { b3 } from '@wagmi/core/chains'

const icon = chainsSvgs.b3Svg
const networkType: IWeb3NetworkType = 'main'

const chainInfo: IWeb3ChainType = {
  chain: b3,
  id: 8333,
  type: 'EVM',
  name: b3.name,
  icon: icon,
  networkType
}

export default chainInfo
