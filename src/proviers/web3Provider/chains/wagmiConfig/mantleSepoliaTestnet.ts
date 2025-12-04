import { chainsSvgs } from 'assets'
import { IWeb3ChainType, IWeb3NetworkType } from '../../type'
import { mantleSepoliaTestnet } from '@wagmi/core/chains'

const icon = chainsSvgs.mantleSvg
const networkType: IWeb3NetworkType = 'test'

const chainInfo: IWeb3ChainType = {
  chain: mantleSepoliaTestnet,
  id: 5003,
  type: 'EVM',
  name: mantleSepoliaTestnet.name,
  icon: icon,
  networkType
}

export default chainInfo
