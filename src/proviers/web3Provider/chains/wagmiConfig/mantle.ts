import { chainsSvgs } from 'assets'
import { IWeb3ChainType, IWeb3NetworkType } from '../../type'
import { mantle } from '@wagmi/core/chains'

const icon = chainsSvgs.mantleSvg
const networkType: IWeb3NetworkType = 'main'

const chainInfo: IWeb3ChainType = {
  id: 5000,
  chain: mantle,
  type: 'EVM',
  name: mantle.name,
  icon: icon,
  networkType
}

export default chainInfo
