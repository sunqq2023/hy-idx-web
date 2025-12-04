import { arrowSvg, querySvg } from '@/assets'
import { Input, Skeleton } from 'antd-mobile'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FixedSizeList as List } from 'react-window'
import { readContract } from '@wagmi/core'
import config from '@/proviers/config'

import {
  MiningMachineHistoryABI,
  MiningMachineHistoryAddress,
  MiningMachineSystemLogicABI,
  MiningMachineSystemLogicAddress,
  MiningMachineSystemStorageABI,
  MiningMachineSystemStorageAddress
} from '@/constants'
import { formatTime, shortenAddress } from '@/utils/helper'
interface Item {
  id: number
  time: number
  makenum: number
  num: number
  distributorUsername: string
  rate: string
  address: string
}

const MakeMHistory = () => {
  const navigate = useNavigate()
  const [pageData, setPageData] = useState<Item[]>([])
  const [cloneData, setCloneData] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [inputValue, setInputValue] = useState('')
  const handlBack = () => {
    navigate('/make-mmm')
  }

  const handleChange = (value: string) => {
    setInputValue(value)

    const newData = cloneData.filter((item) => {
      const toLowerCaseName = item.distributorUsername.toLowerCase()
      const toLowerCaseValue = value.toLowerCase()
      const toLowerCaseAddress = item.address.toLowerCase()
      return (
        toLowerCaseName.includes(toLowerCaseValue) ||
        toLowerCaseAddress.includes(toLowerCaseValue)
      )
    })
    setPageData(newData)
  }

  const handleQuery = useCallback(async () => {
    try {
      setIsLoading(true)
      const result = []
      for (let index = 1; index < 100; index++) {
        const data = await readContract(config, {
          address: MiningMachineSystemStorageAddress,
          abi: MiningMachineSystemStorageABI,
          functionName: 'batchInfos',
          args: [index]
        })
        const batchDistributorUsername = await readContract(config, {
          address: MiningMachineSystemLogicAddress,
          abi: MiningMachineSystemLogicABI,
          functionName: 'batchDistributorUsernames',
          args: [index]
        })

        if (data[4] === 0) break

        result.push({
          time: data[4],
          makenum: Number(data[5]),
          address: data[3],
          rate: data[2],
          distributorUsername: batchDistributorUsername
        })
      }

      setPageData(result)
      setCloneData(result)
      // console.log(result)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    handleQuery()
  }, [handleQuery])

  const [listHeight, setListHeight] = useState(0)
  const listContainerRef = useRef<HTMLDivElement>(null)

  // 动态计算高度
  useEffect(() => {
    if (!listContainerRef.current) return

    const calculateHeight = () => {
      const windowHeight = window.innerHeight
      const topSectionHeight = 180
      const newHeight = windowHeight - topSectionHeight
      setListHeight(newHeight)
    }

    // 初始化计算
    calculateHeight()

    // 监听窗口变化（如旋转屏幕、键盘弹出等）
    window.addEventListener('resize', calculateHeight)
    return () => window.removeEventListener('resize', calculateHeight)
  }, [])

  return (
    <div className="h-full overflow-hidden px-[21px]">
      <div className="flex pt-4">
        <img src={arrowSvg} alt="" onClick={handlBack} />
        <span className="m-auto text-[19px] font-bold">制作母矿机记录</span>
      </div>

      <div className="relative pt-6">
        <Input
          value={inputValue}
          placeholder="输入分销商地址查询"
          className="!bg-[#f3f3f3] rounded-3xl px-4 py-2"
          onChange={handleChange}
        />
        <img
          src={querySvg}
          alt=""
          className="absolute right-4 top-[32px]"
          width={25}
        />
      </div>

      <div
        ref={listContainerRef}
        style={{ height: `${listHeight}px` }}
        className="no-scrollbar"
      >
        {!isLoading ? (
          <List
            height={listHeight}
            width="100%"
            itemCount={pageData.length}
            itemSize={237}
            itemData={pageData}
          >
            {Row}
          </List>
        ) : (
          <Skeleton.Paragraph animated className={`customSkeleton`} />
        )}
      </div>
    </div>
  )
}

const Row = ({
  index,
  style,
  data
}: {
  data: Item[]
  index: number
  style: React.CSSProperties
}) => {
  const item = data[index]
  return (
    <div
      style={{
        ...style,
        height: '227px'
      }}
    >
      <div className="history-container flex text-[15px] mt-4">
        <div className="w-[80px] flex flex-col gap-2 text-[#5B5B5B]">
          <div>制作时间:</div>
          <div>制作数量:</div>
          <div>分销商备注:</div>
          <div>提成比例:</div>
          <div>钱包地址:</div>
        </div>
        <div className="ml-auto w-[73%] font-bold flex flex-col gap-2">
          <div>{formatTime(item.time)}</div>
          <div>{item.makenum} 台</div>
          <div>{item.distributorUsername}</div>
          <div>{item.rate} %</div>
          <div className="w-full break-words">{item.address}</div>
        </div>
      </div>
    </div>
  )
}

export default MakeMHistory
