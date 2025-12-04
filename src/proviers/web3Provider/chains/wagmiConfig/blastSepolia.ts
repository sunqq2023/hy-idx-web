import { chainsSvgs } from 'assets'
import { IWeb3ChainType, IWeb3NetworkType } from '../../type'
import { blastSepolia } from '@wagmi/core/chains'

const icon = chainsSvgs.blastSvg
const networkType: IWeb3NetworkType = 'test'

const chainInfo: IWeb3ChainType = {
  chain: blastSepolia,
  id: 168_587_773,
  type: 'EVM',
  name: blastSepolia.name,
  icon: icon,
  networkType
}

export default chainInfo
