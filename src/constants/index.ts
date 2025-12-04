import MiningMachineSystemStorageABI from './MiningMachineSystemStorage'
import MiningMachineSystemLogicABI from './MiningMachineSystemLogic'
import MiningMachineProductionLogicABI from './MiningMachineProductionLogic'
import MiningMachineHistoryABI from './MiningMachineHistory'
import MiningMachineNodeSystemABI from './MiningMachineNodeSystem'
import SelluserManagerABI from './user'
import MiningMachineSystemStorageExtendABI from './MiningMachineSystemStorageExtend'
import MiningMachineSystemLogicExtendABI from './MiningMachineSystemLogicExtend'
import MiningMachineHistoryExtendABI from './MiningMachineHistoryExtend'

// 生产网：
// IDX 合约地址
const IDX_CONTRACTS_ADDRESS = '0xc98F60B3F98E8Bf860436746db637e13B0e17458'
// USDT 合约地址
const USDT_CONTRACTS_ADDRESS = '0x55d398326f99059fF775485246999027B3197955'
// 链ID
const CHAIN_ID = 56
// 数据存储合约地址
const StorageAddress = '0xB256459d072A52e668b8a86a7cbFf9C475Ec98c2'
// 逻辑合约地址
const LogicAddress = '0x895e8B68D93b2cD5fF4F2bf22cCb3697235C7AfD'
// 生产合约地址
const ProductionLogicAddress = '0x90531429c182707190de682Ed345e3577D44C3d6'
// 历史记录合约地址
const HistoryAddress = '0x367f5FaE08dC307B3Ac8A9A7AA26AC3005C6B51f'
// 节点合成合约地址
const NodeSystemAddress = '0xf080f93067F52843231B13fF5024D41767898Bc8'
// 扩展的数据存储合约地址
const ExtendStorageAddress = '0xdc567714763206341aC1d90C0d2fc58c57739412'
// 扩展的逻辑合约地址
const ExtendLogicAddress = '0xFA5eA849E045520996725d13C3160D1D5420078e'
// 扩展的历史合约地址
const ExtendHistoryAddress = '0x6e426AFED0cF32d6E00b29c791199441658E4f73'
//挂售合约a
const SelluserManagerAddress = '0x8e10b9ba4c78fe8d6a2ecf3fa6307f5e6c1ceebe'



// 测试网：

// // IDX 合约地址
// const IDX_CONTRACTS_ADDRESS = '0xa67ec3cC0d4E0a3B1D2C72bF5F5206FdAfcaf8bD'
// // USDT 合约地址
// const USDT_CONTRACTS_ADDRESS = '0x2Bb3Ac5204Aba14E2915ab49052D82471C3f0C67'
// // 链ID
// const CHAIN_ID = 97
// // 数据存储合约地址
// const StorageAddress = '0x4fb5731AC9B7a2d9BA1cD3414AeE28C747E3A846'
// // 逻辑合约地址
// const LogicAddress = '0x21e83FeB46De273E10831C7eab3E378d5091BF03'
// // 生产合约地址
// const ProductionLogicAddress = '0xFec4753a65367315D2787b56293d84D670DDFAEd'
// // 历史记录合约地址
// const HistoryAddress = '0x70587c6ee25aa369aaf9f2d9c04076ba930009ac'
// // 节点合成合约地址
// const NodeSystemAddress = '0x8419494a5478f35f80737753fecc34b5da6ea5ea'
// // 扩展的数据存储合约地址
// const ExtendStorageAddress = '0x7F36bEEb8069d163D09DCAe02c7bD8551bDDaDA8'
// // 扩展的逻辑合约地址
// const ExtendLogicAddress = '0x7eB1Ad7425806fE70346626049d81E2798fcbcAD'
// // 扩展的历史合约地址
// const ExtendHistoryAddress = '0x66C78e71c24bB173903ed3bfBA457A625Bb7C0aa'
// //挂售合约a
// const SelluserManagerAddress = '0x8e10b9ba4c78fe8d6a2ecf3fa6307f5e6c1ceebe'


const ALLOWANCE_QUOTA = '10000000'

export {
  StorageAddress as MiningMachineSystemStorageAddress,
  LogicAddress as MiningMachineSystemLogicAddress,
  ProductionLogicAddress as MiningMachineProductionLogicAddress,
  HistoryAddress as MiningMachineHistoryAddress,
  NodeSystemAddress as MiningMachineNodeSystemAddress,
  SelluserManagerAddress as MiningMachineSelluserManagerAddress,
  ExtendStorageAddress as MiningMachineSystemStorageExtendAddress,
  ExtendLogicAddress as MiningMachineSystemLogicExtendAddress,
  ExtendHistoryAddress as MiningMachineHistoryExtendAddress,
  MiningMachineSystemStorageABI,
  MiningMachineSystemLogicABI,
  MiningMachineProductionLogicABI,
  MiningMachineHistoryABI,
  MiningMachineNodeSystemABI,
  SelluserManagerABI,
  MiningMachineSystemStorageExtendABI,
  MiningMachineSystemLogicExtendABI,
  MiningMachineHistoryExtendABI,
  IDX_CONTRACTS_ADDRESS,
  USDT_CONTRACTS_ADDRESS,
  CHAIN_ID,
  ALLOWANCE_QUOTA
}
