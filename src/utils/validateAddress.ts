import { Web3Type } from '@/proviers/web3Provider/type'
// import TonWeb from 'tonweb'

const validateEvmAddress = (address: string) => {
  const evmRegex = /^0x[a-fA-F0-9]{40}$/
  return evmRegex.test(address)
}

const validateSolAddress = (address: string) => {
  const solRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
  return solRegex.test(address)
}
const validateTonAddress = (address: string) => {
  try {
    new TonWeb.Address(address)
    return true
  } catch (error) {
    return false
  }
}

const validateSuiAddress = (address: string) => {
  const suiRegex = /^[1-9A-HJ-NP-Za-km-z]{64}$/
  return suiRegex.test(address)
}

const validateTronAddress = (address: string) => {
  const tronRegex = /^T[1-9A-HJ-NP-Za-km-z]{33}$/
  return tronRegex.test(address)
}

const validateP2PKH = (address: string) => {
  const p2pkhRegex = /^(1|[mn])[1-9A-HJ-NP-Za-km-z]{25,34}$/
  return p2pkhRegex.test(address)
}
const validateP2WPKH = (address: string) => {
  const p2wpkhRegex = /^(bc1|tb1)[0-9a-z]{39,59}$/
  return p2wpkhRegex.test(address)
}

const validateP2TR = (address: string) => {
  const p2trRegex = /^(bc1p|tb1p)[0-9a-z]{39,59}$/
  return p2trRegex.test(address)
}
const validateP2SH = (address: string) => {
  const p2shRegex = /^(3|2)[1-9A-HJ-NP-Za-km-z]{25,34}$/
  return p2shRegex.test(address)
}

const validateBtcAddress = (address: string, btcAddrType: string) => {
  switch (btcAddrType) {
    case 'bitcoinP2Pkh':
      return validateP2PKH(address)
    case 'bitcoinP2Wpkh':
      return validateP2WPKH(address)
    case 'bitcoinP2Sh':
      return validateP2SH(address)
    case 'bitcoinP2Tr':
      return validateP2TR(address)
    default:
      return false
  }
}

export const validateAddressFnMap = {
  [Web3Type.EVM]: validateEvmAddress,
  [Web3Type.BTC]: validateBtcAddress,
  [Web3Type.SOL]: validateSolAddress,
  [Web3Type.TON]: validateTonAddress,
  [Web3Type.TRON]: validateTronAddress,
  [Web3Type.SUI]: validateSuiAddress
}
