import { arrowSvg } from '@/assets'
import { formatTime, shortenAddress } from '@/utils/helper'
import { Dialog, Divider, Skeleton, Toast } from 'antd-mobile'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FixedSizeList as List } from 'react-window'
import {
  readContract,
  multicall,
  writeContract,
  waitForTransactionReceipt
} from '@wagmi/core'
import config from '@/proviers/config'
import {
  CHAIN_ID,
  MiningMachineHistoryABI,
  MiningMachineHistoryAddress,
  MiningMachineProductionLogicABI,
  MiningMachineProductionLogicAddress,
  MiningMachineSystemLogicABI,
  MiningMachineSystemLogicAddress
} from '@/constants'
import { useAccount } from 'wagmi'
import { formatEther } from 'viem'
import EmptyComp from '@/components/EmptyComp'

interface Item {
  orderId: number
  seller: `0x${string}`
  buyer: `0x${string}`
  createTime: string
  status: number
  orderType: number
  price: number
  machineIds: number[]
}

// 新增：合成矿机记录接口返回类型定义
interface MixChildRecord {
  mintOrderId: number
  timestamp: number
  quantity: number
  relatedBatchId: number
  mixConsumed?: number // 可选：从其他接口补充的消耗数据
}

const MixBill = () => {
  const { address: userAddress } = useAccount()
  const navigate = useNavigate()
  const [recordList, setRecordList] = useState<Array<{ type: number } & any>>([])
  const [isQuerying, setIsQuerying] = useState(false)

  const handlBack = () => {
    navigate('/user')
  }

  const handleQuery = useCallback(async () => {
    try {
      setIsQuerying(true)
      
      // 1. 合成矿机记录（使用新接口）
      const mixChildRecords = await readContract(config, {
        address: MiningMachineHistoryAddress, // 新接口所在合约地址
        abi: MiningMachineHistoryABI, // 新ABI
        functionName: 'getMixChildRecords', // 新接口名称
        args: [userAddress, 0, 100] // 参数：用户地址、起始索引、查询数量
      })

      // 转换合成矿机记录格式（type: 0）
      const mixChildRecordsList = (mixChildRecords as any[]).map((item) => ({
        type: 0,
        mintOrderId: Number(item.mintOrderId),
        quantity: Number(item.quantity),
        timestamp: Number(item.timestamp),
        relatedBatchId: Number(item.relatedBatchId),
        mixConsumed: 0 // 临时占位，实际场景需从对应批次接口补充
      }))

      // 2. 兑换IDX记录（保持不变）
      const bigNumIds = await readContract(config, {
        address: MiningMachineProductionLogicAddress,
        abi: MiningMachineProductionLogicABI,
        functionName: 'getUserReleaseIds',
        args: [userAddress]
      })

      const contracts = (bigNumIds as bigint[]).map((id) => ({
        address: MiningMachineProductionLogicAddress,
        abi: MiningMachineProductionLogicABI,
        functionName: 'getReleaseInfo',
        args: [userAddress, id]
      }))

      const result = await multicall(config, { contracts })
      const exchangeIdxRecordsList = result.map((item) => ({
        totalAmount: +formatEther(item.result[0]),
        startTime: Number(item.result[1]),
        releasedAmount: +formatEther(item.result[2]),
        releasableAmount: +formatEther(item.result[3]),
        remainingAmount: +formatEther(item.result[4]),
        remainingLockTime: Number(item.result[5]),
        remainingReleaseTime: Number(item.result[6]),
        type: 1
      }))

      // 3. 矿机收益积分记录（保持不变）
      const claimMixRecords = await readContract(config, {
        address: MiningMachineProductionLogicAddress,
        abi: MiningMachineProductionLogicABI,
        functionName: 'getClaimMixRecords',
        args: [userAddress, 0, 100]
      })

      const claimMixRecordsList = (claimMixRecords as any[]).map((item) => ({
        amount: Number(formatEther(item.amount)),
        machineId: Number(item.machineId),
        timestamp: Number(item.timestamp),
        type: 2
      }))

      // 组装完整记录列表
      const list = [
        ...mixChildRecordsList,
        ...exchangeIdxRecordsList,
        ...claimMixRecordsList
      ].sort((a, b) => b.timestamp - a.timestamp) // 按时间倒序排列

      setRecordList(list)
    } catch (error) {
      console.error('查询记录失败:', error)
      Toast.show({ content: '查询记录失败，请重试', duration: 2000 })
    } finally {
      setIsQuerying(false)
    }
  }, [userAddress])

  useEffect(() => {
    if (userAddress) {
      handleQuery()
    }
  }, [handleQuery, userAddress])

  // 动态计算列表高度（保持不变）
  const [listHeight, setListHeight] = useState(0)
  const listContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!listContainerRef.current) return
    const calculateHeight = () => {
      const windowHeight = window.innerHeight
      const topSectionHeight = 70
      const newHeight = windowHeight - topSectionHeight
      setListHeight(newHeight)
    }
    calculateHeight()
    window.addEventListener('resize', calculateHeight)
    return () => window.removeEventListener('resize', calculateHeight)
  }, [])

  // 列表项渲染（重点修改合成矿机卡片）
  const Row = ({
    index,
    style,
    data
  }: {
    index: number
    style: React.CSSProperties
    data: Array<{ type: number } & any>
  }) => {
    const item = data[index]

    const getTxOperation = (type: number) => {
      switch (type) {
        case 0: return '合成矿机'
        case 1: return '兑换IDX'
        case 2: return '提取MIX'
        default: return `未知状态(${type})`
      }
    }

    return (
      <div style={{ ...style, height: '136px' }}>
        <div className="p-[20px] bg-white rounded-2xl text-[14px] flex flex-col gap-1 relative text-[#777777]">
          <div className="flex gap-2">
            <div>操作类型:</div>
            <div className="text-black ">{getTxOperation(item.type)}</div>
          </div>

         
          {item.type === 0 && (
            <>
              <div className="flex gap-2">
                <div>合成矿机数量:</div>
                <div className="text-black ">{item.quantity}</div> 
              </div>
              <div className="flex gap-2">
                <div>消耗MIX通证数:</div>
                <div className="text-black ">80</div> <div className="text-black ">MIX积分</div>
              </div>
              <div className="flex gap-2">
                <div>矿机合成时间:</div>
                <div className="text-black ">
                  {item.timestamp ? formatTime(item.timestamp) : '---'} 
                </div>
              </div>
              
              
            </>
          )}

          
          {item.type === 1 && (
            <>
              <div className="flex gap-2">
                <div>提取IDX数量:</div>
                <div className="text-black ">{item.totalAmount.toFixed(4)}</div>
              </div>
              
              <div className="flex gap-2">
                <div>提取时间:</div>
                <div className="text-black ">{formatTime(item.startTime)}</div>
              </div>
            </>
          )}

          
          {item.type === 2 && (
            <>
              <div className="flex gap-2">
                <div>提取积分:</div>
                <div className="text-black ">{item.amount.toFixed(4)}</div>
              </div>
              <div className="flex gap-2">
                <div>矿机编号:</div>
                <div className="text-black ">{item.machineId}</div>
              </div>
              <div className="flex gap-2">
                <div>生成时间:</div>
                <div className="text-black ">{formatTime(item.timestamp)}</div>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-hidden px-[21px]">
      <div className="flex pt-4">
        <img src={arrowSvg} alt="返回" onClick={handlBack} className="cursor-pointer" />
        <span className="m-auto text-[17px] ">MIX账单</span>
      </div>
      <div
        ref={listContainerRef}
        style={{ height: `${listHeight}px`, marginTop: '10px' }}
        className="no-scrollbar"
      >
        {!isQuerying ? (
          recordList.length > 0 ? (
            <List
              height={listHeight}
              width="100%"
              itemCount={recordList.length}
              itemSize={145}
              itemData={recordList}
            >
              {Row}
            </List>
          ) : (
            <EmptyComp />
          )
        ) : (
          <Skeleton.Paragraph animated className="customSkeleton" />
        )}
      </div>
    </div>
  )
}

export default MixBill