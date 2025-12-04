import { getAllTokenBalancesByAddress } from 'api/okx'
import { BtcAddressType } from 'api/type'
import { AssetsToken } from '@/stores/tokenStore/type/AssetsToken'
import { BaseChain } from '../tokenStore/type/BaseChain'
import {
  IChainId,
  IWeb3ChainType,
  Web3Type
} from '@/proviers/web3Provider/type'
import chains, {
  allChains,
  evmChainConfig,
  marketChain,
  prodEvmChains
} from '@/proviers/web3Provider/chains'
import { solScanUrl } from 'config/sol'
import { mockTonOkxChainID, tonScanUrl } from 'config/ton'
import { tronScanUrl } from 'config/tron'
import { IHistoryType } from '@/state'
import { TransactionsType } from './type'
import {
  CURRENT_CACHE_VERSION,
  getCache,
  setCache,
  STORAGE_KEY
} from '@/utils/cacheManage'
import { postSwapPoint } from 'api'
import { formatUnits } from 'viem'

export const getBtcBalance = async (params: {
  address: Record<BtcAddressType, string>
}) => {
  const { address: addressMap } = params
  const retList = await Promise.allSettled(
    Object.keys(addressMap).map(async (key) => {
      const data = await getAllTokenBalancesByAddress({
        address: addressMap[key as BtcAddressType],
        chains: [0]
      })
      return {
        type: key,
        data,
        address: addressMap[key as BtcAddressType]
      }
    })
  )

  const fulfilledBalanceMap: {
    address: string
    type: string
    value: any
  }[] = []

  retList.forEach((ret) => {
    if (ret.status === 'fulfilled') {
      const { address, type, data } = ret.value
      const value = data?.data?.[0]?.tokenAssets || []
      fulfilledBalanceMap.push({ address, type, value })
    }
  })
  return fulfilledBalanceMap
}

export function iChainToBaseChain(
  iChain: IWeb3ChainType,
  displayName?: string | undefined
) {
  if (!iChain.chain || !iChain.chain.id) {
    throw new Error('iChainToBaseChain function: chain need')
  }
  return {
    chainId: iChain.chain?.id,
    type: iChain.type,
    icon: iChain.icon,
    decimals: iChain.chain?.nativeCurrency.decimals,
    symbol: iChain.chain?.nativeCurrency.symbol,
    name: iChain.chain?.nativeCurrency.name,
    displayName: displayName ?? ''
  } as BaseChain
}

export function BaseChainToiChain(base: BaseChain) {
  return evmChainConfig(base.chainId)
}

export const getScanUrl = ({
  chain,
  hash
}: {
  chain: IWeb3ChainType | undefined
  hash: string
}) => {
  switch (chain?.type) {
    case 'EVM':
      return chain?.chain?.blockExplorers?.default.url + '/tx/' + hash
    case 'SOL':
      return solScanUrl + hash
    case 'TON':
      return tonScanUrl + hash
    case 'TRON':
      return tronScanUrl + hash
    default:
      return undefined
  }
}

export const getChainByChainId = (chainId: number) => {
  if (chainId === chains.solana.id) {
    return chains.solana
  }
  if (chainId === chains.btc.id) {
    return chains.btc
  }
  if (chainId === chains.ton.id || chainId === 607) {
    // both 1100 and 607 are ton chain
    return chains.ton
  }
  if (chainId === chains.tron.id) {
    return chains.tron
  }

  return allChains.find((chain) => chain.id === chainId)
}

export const getChainByToken = (token: AssetsToken) => {
  const tokenChainId = token.chainId
  return getChainByChainId(tokenChainId)
}

export const isChainEVM = (chainId: IChainId) =>
  prodEvmChains.filter((i) => i.id === chainId).length

export const supportSwapChains = allChains.filter((chain) => {
  return (
    chain &&
    chain?.type !== 'ALL' &&
    chain?.chain?.id !== chains.b3?.id &&
    (chain?.type === 'EVM' ||
      chain.type === 'SOL' ||
      chain.type === 'TRON' ||
      chain.type === 'TON')
  )
})

export const evmInnerChains = allChains
  .filter((chain) => !!chain.chain && chain.type === Web3Type.EVM)
  .map((chain) => chain.chain)
  .flat()

export const getSwapChainId = (chainId: IChainId | undefined) => {
  return chainId === chains.ton.id ? mockTonOkxChainID : chainId
}

export const chainIds = allChains
  .map((chain) => chain.id)
  .filter((item) => typeof item === 'number')

export const chainMappings = allChains.reduce(
  (prev, next) => {
    prev[next.name] = next
    return prev
  },
  {} as Record<string, IWeb3ChainType>
)

export const marketTokenLink = (chainId: number, address?: string) => {
  if (getChainByChainId(chainId)?.id === -1) {
    return ''
  }
  const market = marketChain[chainId]
  const token = address ? `${market.chain}-${address}` : market.token
  return `${market.chain}/${token}`
}

export const sortByPriceBalance = (income: AssetsToken[]) => {
  const list = [...income]
  list.sort((a, b) => {
    const aFormatted = Number(a.formatted) * Number(a.price)
    const bFormatted = Number(b.formatted) * Number(b.price)
    return bFormatted - aFormatted
  })
  return list
}

export const tokenMappings = (income: AssetsToken[]) => {
  return income.reduce(
    (map, item) => {
      map[item.id] = item
      return map
    },
    {} as Record<string, AssetsToken>
  )
}

export const findToken = (
  tokenMappings: Record<string, AssetsToken>,
  item: {
    chainId: number
    symbol: string
    address?: string
  }
) => {
  if (item.symbol) {
    return (
      tokenMappings[`${item.symbol}_${item.address}_${item.chainId}`] ||
      tokenMappings[`${item.symbol}__${item.chainId}`]
    )
  }
  return undefined
}

/**txs helper*/
export const getWalletTransactionsKey = () => {
  let walletId = null
  const userStr = localStorage.getItem(STORAGE_KEY.user)
  if (userStr) {
    const userInfo = JSON.parse(userStr)
    walletId = userInfo['defaultWalletId']
    return `${STORAGE_KEY.TRANSACTIONS}_${walletId}`
  }
  return null
}

export const txsFilter = (
  txs: TransactionsType,
  selectFunc: (item: IHistoryType) => void
) => {
  // const txs: TransactionsType = getTxsList()
  return Object.keys(txs)
    .map((key) => {
      const intKey = Number(key) as IChainId
      return txs[intKey]
    })
    .filter((item) => !!item)
    .flat()
    .filter(selectFunc)
}

const TransferToAssetsToken = (income: any) => {
  if (income.source) return income
  const address = income?.contract ?? income?.address ?? ''
  const assets: AssetsToken = {
    isNative: income?.is_native,
    isToken: !income?.is_native,
    chainId: income.chain_id,
    decimals: income.decimals,
    symbol: income.symbol,
    name: income.name ?? income.symbol,
    address,
    balance: '0',
    price: income.price,
    image: income.image,
    source: 'history',
    id: `${address}-${income.chain_id}-${income.symbol}`,
    formatted: '0',
    whiteToken: undefined,
    customToken: undefined
  }
  return assets
}

export const pendingChangedForSwap = (tx: IHistoryType) => {
  if (tx.historyType !== 'Swap') return
  if (tx.status !== 'success') return
  const amount = BigInt(tx.fromAmount ?? '0')
  const decimals = tx.fromSwapTokens?.token?.decimals ?? 18
  const formatted = formatUnits(amount, decimals)
  const price = +formatted * (tx.fromSwapTokens?.token?.price ?? 1)
  const parmas = {
    fromToken: tx.fromSwapTokens?.token?.symbol ?? '',
    fromChain: tx.fromSwapTokens?.chain?.name ?? '',
    fromContract: tx.fromSwapTokens?.token?.name ?? '',
    toToken: tx.toSwapTokens?.token?.symbol ?? '',
    toChain: tx.toSwapTokens?.chain?.name ?? '',
    toContract: tx.toSwapTokens?.token?.name ?? '',
    amount: formatted,
    priceUsd: price.toString(),
    txHash: tx.hash as string
  }
  postSwapPoint(parmas)
}

export const getTxsList = () => {
  const key = getWalletTransactionsKey()
  if (!key) return {}

  const txs: TransactionsType = getCache(key, {})
  for (const chainId in txs) {
    const list = txs[chainId] as IHistoryType[]
    list.forEach((history) => {
      if (history.fromSwapTokens) {
        history.fromSwapTokens.token = TransferToAssetsToken(
          history.fromSwapTokens.token
        )
      }
      if (history.toSwapTokens) {
        history.toSwapTokens.token = TransferToAssetsToken(
          history.toSwapTokens.token
        )
      }
    })
  }
  return txs
}

export const sortByTime = (txs: TransactionsType) => {
  for (const txChainId in txs) {
    const chainId = Number(txChainId) as IChainId
    const txChainList = txs[chainId]
    txChainList?.sort((a, b) => b.time - a.time)
    txs[chainId] = txChainList
  }
}

export const setTxsList = (income: any) => {
  const key = getWalletTransactionsKey()
  if (!key) return
  for (const chainId in income) {
    const list: IHistoryType[] = income[chainId]
    list.forEach((history) => {
      if (history.fromSwapTokens) {
        history.fromSwapTokens.token = TransferToAssetsToken(
          history.fromSwapTokens.token
        )
      }
      if (history.toSwapTokens) {
        history.toSwapTokens.token = TransferToAssetsToken(
          history.toSwapTokens.token
        )
      }
    })
  }
  setCache(key, income)
}

export const mergeIncomeData = (
  localData: TransactionsType,
  incomeData: TransactionsType
) => {
  const temp: TransactionsType = {}
  const keys = [...Object.keys(localData), ...Object.keys(incomeData)]
  for (const txChainId of keys) {
    const chainId = Number(txChainId) as IChainId
    const txChainLocal = localData[chainId] || []
    const txChainDB = incomeData[chainId] || []
    const holder = new Set()
    const mergeRes: IHistoryType[] = []
    const mergeList = [...txChainLocal, ...txChainDB]
    mergeList.forEach((iHistory) => {
      if (!holder.has(iHistory.hash)) {
        mergeRes.push(iHistory)
        holder.add(iHistory.hash)
      }
    })
    temp[chainId] = mergeRes
  }
  return temp
}

export const txsStoreMergeByIncome = (incomeTxs: TransactionsType) => {
  if (!incomeTxs) return
  const txs: TransactionsType = getTxsList()
  const merged = mergeIncomeData(txs, incomeTxs)
  sortByTime(merged)
  return merged
}

export const addSignleTx = (
  txs: TransactionsType,
  history: IHistoryType,
  chainId: IChainId
) => {
  const temp: TransactionsType = { ...txs }
  //check if give a wrong data
  if (!history) return
  if (!chainId && chainId !== 0) return
  if (!history.hash) return
  //check if find
  const finds = txsFilter(temp, (iHistory) => iHistory.hash === history.hash)
  if (finds.length) return
  const txsKey = chainId as IChainId
  const items = temp[txsKey] ?? []
  temp[txsKey] = [history as IHistoryType, ...(items ? items : [])]
  sortByTime(temp)
  return temp
}

export const updateSignleTx = (
  txs: TransactionsType,
  history: IHistoryType
) => {
  if (!history) return
  const temp: TransactionsType = { ...txs }
  for (const txChainId in temp) {
    const chainId = Number(txChainId) as IChainId
    const txChainList = temp[chainId]
    txChainList?.forEach((iHistoryType, idx) => {
      if (iHistoryType.hash === history.hash) {
        txChainList[idx] = history
      }
    })
  }
  sortByTime(temp)
  return temp
}

export const initTokenList = () => {
  const user = localStorage.getItem('user')
  if (!user) return []
  const userObj = JSON.parse(user)
  const cachedData = localStorage.getItem(
    `__TOKENS_LIST_${userObj.defaultWalletId}_${userObj.id}`
  )
  if (!cachedData) return []
  try {
    const { version, data } = JSON.parse(cachedData)
    if (version === CURRENT_CACHE_VERSION) {
      return data
    } else {
      return []
    }
  } catch (e) {
    return []
  }
}

export const getChainIdByMarketChainName = (chainName: string) => {
  return Object.keys(marketChain).find((key) => {
    return marketChain[key].chain === chainName
  })
}
