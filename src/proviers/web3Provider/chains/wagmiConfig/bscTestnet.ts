import { chainsSvgs } from 'assets'
import { IWeb3ChainType, IWeb3NetworkType } from '../../type'
import { bscTestnet } from '@wagmi/core/chains'

const icon = chainsSvgs.bscSvg
const networkType: IWeb3NetworkType = 'test'

const chainInfo: IWeb3ChainType = {
  chain: bscTestnet,
  id: 97,
  type: 'EVM',
  name: bscTestnet.name,
  icon: icon,
  networkType
}

export default chainInfo
