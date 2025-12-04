import { arrowSvg } from '@/assets'
import { Button, Divider, Toast } from 'antd-mobile'
import { SHA256 } from 'crypto-js'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FixedSizeList as List } from 'react-window'
import {
  waitForTransactionReceipt,
  writeContract,
  readContract,
  multicall
} from '@wagmi/core'
import config from '@/proviers/config'
import {
  ALLOWANCE_QUOTA,
  CHAIN_ID,
  IDX_CONTRACTS_ADDRESS,
  MiningMachineHistoryABI,
  MiningMachineHistoryAddress,
  MiningMachineSystemLogicABI,
  MiningMachineSystemLogicAddress
} from '@/constants'
import { useAccount, useWriteContract } from 'wagmi'
import LoadingButton from '@/components/LoadingButton'
import AdaptiveNumber, { NumberType } from '@/components/AdaptiveNumber'
import { erc20Abi, formatEther, parseEther, parseGwei } from 'viem'
import orderStore from '@/stores/orderStore'
import { usePaymentCheck } from '@/hooks/usePaymentCheck'
import { writeContractWithGasFallback, getGasConfigByFunctionName } from '@/utils/contractUtils'

const getMachineName = (val: number) => {
  return val === 1 ? '母矿机' : '子矿机'
}

const generateCode = (num: number) => {
  const input = num + ''
  const hashHex = SHA256(input).toString()
  // 提取前4位字母和后4位十六进制
  const letterPart =
    hashHex
      .match(/[a-zA-Z]/g)
      ?.slice(0, 4)
      .join('') || 'ABCD'
  const hexPart = hashHex.slice(10, 14)

  return (letterPart + hexPart).toUpperCase()
}

const UserPayForBuyMachine = () => {
  const navigate = useNavigate()
  const { writeContractAsync } = useWriteContract()
  const [isPaying, setIsPaying] = useState(false)
  const [usdtToIdxRate, setUsdtToIdxRate] = useState('')

  const location = useLocation()

  const pageData = location.state

  const machineIdsAndOrderTypeList = location.state.machineIds.map(
    (id: number) => {
      return {
        id,
        mtype: location.state.orderType
      }
    }
  )

  const handlBack = () => {
    navigate('/user/history')
  }

  const getUsdtToIdxRate = async () => {
    try {
      const data = await readContract(config, {
        address: MiningMachineSystemLogicAddress,
        abi: MiningMachineSystemLogicABI,
        functionName: 'getIDXAmount',
        args: [1]
      })

      const rate = data ? formatEther(data) : '0'
      setUsdtToIdxRate(rate)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    getUsdtToIdxRate()
  }, [])

  const [listHeight, setListHeight] = useState(0)
  const listContainerRef = useRef<HTMLDivElement>(null)
  const { address: userAddress } = useAccount()

  const {
    isLoading: isPaymentCheckLoading,
    isBalanceSufficient,
    isAllowanceSufficient
  } = usePaymentCheck(
    parseEther(String(Math.ceil(pageData.price * +usdtToIdxRate)))
  )

  // 动态计算高度
  useEffect(() => {
    if (!listContainerRef.current) return

    const calculateHeight = () => {
      const windowHeight = window.innerHeight
      const topSectionHeight = 370
      const newHeight = windowHeight - topSectionHeight
      setListHeight(newHeight)
    }

    // 初始化计算
    calculateHeight()

    // 监听窗口变化（如旋转屏幕、键盘弹出等）
    window.addEventListener('resize', calculateHeight)
    return () => window.removeEventListener('resize', calculateHeight)
  }, [])

  const handleQueryAllListedOrders = useCallback(async () => {
    try {
      // setisLoadingPage(true)
      const buyerOrderIds = await readContract(config, {
        address: MiningMachineHistoryAddress,
        abi: MiningMachineHistoryABI,
        functionName: 'getBuyerOrderIds',
        args: [userAddress, 0, 100]
      })

      const bignumToNumber = (buyerOrderIds as bigint[]).map((e) => Number(e))

      const contracts = bignumToNumber.map((id) => {
        return {
          address: MiningMachineHistoryAddress,
          abi: MiningMachineHistoryABI,
          functionName: 'allOrders',
          args: [id]
        }
      })
      const data2 = await multicall(config, {
        contracts
      })
      const itemList = data2.map((item) => {
        return {
          orderId: Number(item.result[0]),
          seller: item.result[1],
          buyer: item.result[2],
          createTime: String(item.result[3]),
          status: item.result[4],
          orderType: item.result[5]
        }
      })

      const priceAndMachineIdsContracts = bignumToNumber.map((id) => {
        return {
          address: MiningMachineSystemLogicAddress,
          abi: MiningMachineSystemLogicABI,
          functionName: 'internalOrders',
          args: [id]
        }
      })

      const data3 = await multicall(config, {
        contracts: priceAndMachineIdsContracts
      })

      const resultList = itemList.map((item, index) => {
        return {
          ...item,
          price: Number(data3[index].result[2])
        }
      })

      const machineIdsContracts = bignumToNumber.map((id) => {
        return {
          address: MiningMachineSystemLogicAddress,
          abi: MiningMachineSystemLogicABI,
          functionName: 'getInternalOrderMachineIds',
          args: [id]
        }
      })

      const data4 = await multicall(config, {
        contracts: machineIdsContracts
      })

      const resultListWithMachineIds = resultList.map((item, index) => {
        const formatIdToNumber = data4[index].result.map((id: bigint) =>
          Number(id)
        )
        return {
          ...item,
          machineIds: formatIdToNumber
        }
      })

      console.log('buyer list', resultListWithMachineIds)

      // seller orderids

      const sellerOrderIds = await readContract(config, {
        address: MiningMachineHistoryAddress,
        abi: MiningMachineHistoryABI,
        functionName: 'getSellerOrderIds',
        args: [userAddress, 0, 100]
      })

      const sellerBignumToNumber = (sellerOrderIds as bigint[]).map((e) =>
        Number(e)
      )

      const sellercontracts = sellerBignumToNumber.map((id) => {
        return {
          address: MiningMachineHistoryAddress,
          abi: MiningMachineHistoryABI,
          functionName: 'allOrders',
          args: [id]
        }
      })
      const sellerdata2 = await multicall(config, {
        contracts: sellercontracts
      })
      const selleritemList = sellerdata2.map((item) => {
        return {
          orderId: Number(item.result[0]),
          seller: item.result[1],
          buyer: item.result[2],
          createTime: String(item.result[3]),
          status: item.result[4],
          orderType: 2
        }
      })

      const sellerpriceAndMachineIdsContracts = sellerBignumToNumber.map(
        (id) => {
          return {
            address: MiningMachineSystemLogicAddress,
            abi: MiningMachineSystemLogicABI,
            functionName: 'internalOrders',
            args: [id]
          }
        }
      )

      const sellerdata3 = await multicall(config, {
        contracts: sellerpriceAndMachineIdsContracts
      })

      const sellerresultList = selleritemList.map((item, index) => {
        return {
          ...item,
          price: Number(sellerdata3[index].result[2])
        }
      })

      const sellermachineIdsContracts = sellerBignumToNumber.map((id) => {
        return {
          address: MiningMachineSystemLogicAddress,
          abi: MiningMachineSystemLogicABI,
          functionName: 'getInternalOrderMachineIds',
          args: [id]
        }
      })

      const sellerdata4 = await multicall(config, {
        contracts: sellermachineIdsContracts
      })

      const sellerresultListWithMachineIds = sellerresultList.map(
        (item, index) => {
          const formatIdToNumber = sellerdata4[index].result.map((id: bigint) =>
            Number(id)
          )
          return {
            ...item,
            machineIds: formatIdToNumber
          }
        }
      )

      console.log('seller list', sellerresultListWithMachineIds)

      let list = [
        ...resultListWithMachineIds,
        ...sellerresultListWithMachineIds
      ]

      const sellList = orderStore.getallListedOrders().map((e) => ({
        ...e,
        orderType: 3
      }))

      list = list
        .filter(
          (item) =>
            item.machineIds.length !== 0 &&
            (item.seller === userAddress || item.buyer === userAddress)
        )
        .concat(sellList)
        .sort((a, b) => a.status - b.status)

      // 用户交易历史
      const unPaidLength = list.filter(
        (item) =>
          item.status === 0 &&
          (item.seller === userAddress || item.buyer === userAddress)
      ).length
      orderStore.updateData(list, unPaidLength)
    } catch (error) {
      console.error(error)
    }
  }, [userAddress])

  const handlePay = async () => {
    try {
      if (isPaymentCheckLoading) return

      if (!isBalanceSufficient) {
        Toast.show({
          content: '余额不足',
          position: 'center'
        })
        return
      }

      setIsPaying(true)

      if (!isAllowanceSufficient) {
        // 计算实际需要的金额（这里需要根据具体业务逻辑计算）
        // 假设购买单台矿机需要一定数量的IDX，这里需要根据实际情况调整
        const actualAmount = parseEther(String(pageData.price || 100)) // 需要根据实际业务逻辑调整
        const smartAllowance = actualAmount * 30n  // 调整为30倍授权
        
        console.log('实际需要金额:', formatEther(actualAmount), 'IDX')
        console.log('期望智能授权额度:', formatEther(smartAllowance), 'IDX')
        
        // 先查询当前allowance值
        console.log('查询当前allowance值...')
        const currentAllowance = await readContract(config, {
          address: IDX_CONTRACTS_ADDRESS,
          abi: erc20Abi,
          functionName: 'allowance',
          args: [userAddress!, MiningMachineSystemLogicAddress]
        }) as bigint
        
        console.log('当前allowance值:', formatEther(currentAllowance), 'IDX')
        
        // 检查当前allowance是否已经足够（超过2倍实际需要）
        if (currentAllowance >= smartAllowance) {
          console.log('当前allowance已足够，无需重新授权')
        } else {
          console.log('当前allowance不足，执行智能授权')
          
          await writeContractWithGasFallback({
            address: IDX_CONTRACTS_ADDRESS,
            abi: erc20Abi,
            functionName: 'approve',
            args: [MiningMachineSystemLogicAddress, smartAllowance]
          }, getGasConfigByFunctionName('approve'))
        }
      }

      const hash = await writeContractWithGasFallback({
        address: MiningMachineSystemLogicAddress,
        abi: MiningMachineSystemLogicABI,
        functionName: 'buyMachine',
        args: [pageData.orderId]
      }, getGasConfigByFunctionName('buyMachine'))

      await waitForTransactionReceipt(config, {
        hash,
        chainId: CHAIN_ID
      })

      setIsPaying(false)
      handleQueryAllListedOrders()

      navigate('/user')
    } catch (error) {
      Toast.show({
        content: '支付失败',
        position: 'center',
        duration: 2000
      })
      setIsPaying(false)
      console.error(error)
    }
  }

  return (
    <div>
      <div className="h-full overflow-hidden px-[21px]">
        <div className="flex pt-4">
          <Button
            onClick={handlBack}
            className="!p-[0] !rounded-2xl"
            loading={isPaying}
          >
            <img src={arrowSvg} alt="" />
          </Button>
          <span className="m-auto text-[17px] font-bold">支付转让矿机费用</span>
        </div>

        <div className="transfer-container mt-4">
          <div className="text-[16px] font-bold mb-4 text-black">
            待转让详情
          </div>
          <div className="flex justify-between">
            <div className="flex gap-2">
              单价:
              <span className="font-bold text-black">
                <AdaptiveNumber
                  type={NumberType.BALANCE}
                  value={
                    (pageData.price * +usdtToIdxRate) /
                    pageData.machineIds.length
                  }
                  decimalSubLen={2}
                  className="font-bold"
                />
              </span>
              IDX/台
            </div>
            <div className="">
              共计：
              <span className="mr-2 text-[18px] font-bold text-black">
                {pageData.machineIds.length}
              </span>
              台
            </div>
          </div>

          <Divider className="!mt-[10px] !mb-[0]" />

          <div className="flex justify-between py-2 text-[#777777]">
            <div>#</div>
            <div>矿机编号</div>
            <div>矿机类型</div>
          </div>

          <Divider className="!mt-[10px] !mb-[0]" />

          <div
            ref={listContainerRef}
            style={{ height: `${listHeight}px` }}
            className="no-scrollbar"
          >
            <List
              height={listHeight}
              width="100%"
              itemCount={pageData.machineIds.length}
              itemSize={50}
              itemData={machineIdsAndOrderTypeList}
            >
              {Row}
            </List>
          </div>
        </div>
      </div>

      <div className="w-full bg-white h-[87px] flex items-center absolute bottom-0 px-[30px]">
        <div>
          <div>待支付 IDX</div>
          <div className="text-[#FF6D6D] text-[22px] font-bold">
            <AdaptiveNumber
              type={NumberType.BALANCE}
              value={pageData.price * +usdtToIdxRate}
              decimalSubLen={2}
              className="mr-1.5  font-bold"
            />
          </div>
        </div>

        <LoadingButton
          customClass="bg-black text-white rounded-3xl !ml-auto px-8 text-[18px] !h-[50px] !w-[100px]"
          text="支付"
          isLoading={isPaying}
          onClick={handlePay}
        />
      </div>
    </div>
  )
}

const Row = ({
  index,
  style,
  data
}: {
  data: {
    id: number
    mtype: number
  }[]
  index: number
  style: React.CSSProperties
}) => {
  const item = data[index]
  return (
    <div
      style={{
        ...style,
        height: '50px'
      }}
    >
      <div className="flex justify-between py-2">
        <div>{index + 1}</div>
        <div>#{generateCode(item.id)}</div>
        <div>{getMachineName(item.mtype)}</div>
      </div>
      <Divider className="!my-[0]" />
    </div>
  )
}

export default UserPayForBuyMachine
