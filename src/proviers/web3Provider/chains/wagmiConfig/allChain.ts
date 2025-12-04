import { chainsSvgs } from 'assets'
import { IWeb3ChainType, IWeb3NetworkType } from '../../type'

const chain = undefined
const icon = chainsSvgs.allChainSvg
const networkType: IWeb3NetworkType = 'main'

const allChain: IWeb3ChainType = {
  icon: icon,
  id: -1,
  name: 'All Chain',
  networkType: networkType,
  type: 'ALL',
  chain
}

export default allChain
