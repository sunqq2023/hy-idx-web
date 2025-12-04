import { arrowSvg, blackExchangeSvg, whiteExchangeSvg } from '@/assets'
import AdaptiveNumber, { NumberType } from '@/components/AdaptiveNumber'
import {
  CHAIN_ID,
  MiningMachineProductionLogicABI,
  MiningMachineProductionLogicAddress,
  MiningMachineSystemLogicABI,
  MiningMachineSystemLogicAddress,
  MiningMachineSystemStorageABI,
  MiningMachineSystemStorageAddress
} from '@/constants'
import { MachineInfo } from '@/constants/types'
import { useSequentialContractWrite } from '@/hooks/useSequentialContractWrite'
import { Button, Divider, Modal, Toast } from 'antd-mobile'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FixedSizeList as List } from 'react-window'
import { formatEther, parseEther, TransactionReceipt } from 'viem'
import config from '@/proviers/config'
import { useAccount } from 'wagmi'
import {
  readContract,
  writeContract,
  waitForTransactionReceipt,
  multicall
} from '@wagmi/core'
import { formatTime } from '@/utils/helper'
import EmptyComp from '@/components/EmptyComp'

interface IReleaseInfo {
  //  锁仓 IDX 总数量。
  totalAmount: number
  //  锁仓开始时间。
  startTime: number
  //  已释放数量。
  releasedAmount: number
  //  当前可领取数量。
  releasableAmount: number
  //  剩余未释放数量。
  remainingAmount: number
  //  剩余锁仓时间（秒，锁仓期内有效）。
  remainingLockTime: number
  //  剩余释放时间（秒，释放期内有效）。
  remainingReleaseTime: number
  id: number
}

const ExchangeIdx = () => {
  const { address } = useAccount()
  const [mixBalance, setMixBalance] = useState('')
  const [machineList, setMachineList] = useState<IReleaseInfo[]>([])
  const [usdtToIdxRate, setUsdtToIdxRate] = useState('')

  const [idxToBeClaimed, setIdxToBeClaimed] = useState(0)
  const [remainingAmount, setRemainingAmount] = useState(0)
  const [releasedAmount, setReleasedAmount] = useState(0)

  const { executeSequentialCalls } = useSequentialContractWrite()
  const [isExchangingIDX, setIsExchangingIDX] = useState(false)
  const navigate = useNavigate()
  const [listHeight, setListHeight] = useState(0)
  const listContainerRef = useRef<HTMLDivElement>(null)

  const [isClaimingIDX, setIsClaimingIDX] = useState(false)

  const handleQuery = useCallback(async () => {
    try {
      const bigNumIds = await readContract(config, {
        address: MiningMachineProductionLogicAddress,
        abi: MiningMachineProductionLogicABI,
        functionName: 'getUserReleaseIds',
        args: [address]
      })

      const contracts = (bigNumIds as bigint[]).map((id) => ({
        address: MiningMachineProductionLogicAddress,
        abi: MiningMachineProductionLogicABI,
        functionName: 'getReleaseInfo',
        args: [address, id]
      }))

      const result = await multicall(config, {
        contracts
      })

      const data = result.map((item, i) => {
        return {
          //  锁仓 IDX 总数量。
          totalAmount: +formatEther(item.result[0]),
          //  锁仓开始时间。
          startTime: Number(item.result[1]),
          //  已释放数量。
          releasedAmount: +formatEther(item.result[2]),
          //  当前可领取数量。
          releasableAmount: +formatEther(item.result[3]),
          //  剩余未释放数量。
          remainingAmount: +formatEther(item.result[4]),
          //  剩余锁仓时间（秒，锁仓期内有效）。
          remainingLockTime: Number(item.result[5]),
          //  剩余释放时间（秒，释放期内有效）。
          remainingReleaseTime: Number(item.result[6]),
          id: Number(bigNumIds[i])
        }
      })

      setMachineList(data)

      setReleasedAmount(data.reduce((acc, cur) => acc + cur.releasedAmount, 0))
      setRemainingAmount(
        data.reduce((acc, cur) => acc + cur.remainingAmount, 0)
      )
      setIdxToBeClaimed(
        data.reduce((acc, cur) => acc + cur.releasableAmount, 0)
      )
      console.log('release Info', data)
    } catch (error) {
      console.error(error)
    }
  }, [address])

  useEffect(() => {
    handleQuery()
  }, [handleQuery])

  const queryMIXBalance = useCallback(async () => {
    try {
      const res = await readContract(config, {
        address: MiningMachineSystemStorageAddress,
        abi: MiningMachineSystemStorageABI,
        functionName: 'mixBalances',
        args: [address]
      })
      setMixBalance(res ? formatEther(res) : '0')
    } catch (error) {
      console.error(error)
    }
  }, [address])

  useEffect(() => {
    queryMIXBalance()
  }, [queryMIXBalance])

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

  const handleExchangeMixToIDX = async () => {
    if (+mixBalance < 100) {
      Toast.show({
        content: 'MIX余额不足',
        position: 'center'
      })
      return
    }

    try {
      setIsExchangingIDX(true)

      const exchangeMixCount = Math.floor(+mixBalance / 100)

      console.log('aaa', exchangeMixCount)
      const hash = await writeContract(config, {
        address: MiningMachineProductionLogicAddress as `0x${string}`,
        abi: MiningMachineProductionLogicABI,
        functionName: 'convertMIXtoIDX',
        args: [exchangeMixCount]
      })

      await waitForTransactionReceipt(config, {
        hash,
        chainId: CHAIN_ID
      })
      Toast.show({
        content: '兑换成功',
        position: 'center'
      })
      queryMIXBalance()
      handleQuery()
    } catch (error) {
      console.error(error)
    } finally {
      setIsExchangingIDX(false)
    }
  }

  const handleCloseModal = () => {
    Modal.clear()
  }

  const handleClaimIDX = async () => {
    try {
      // console.log(123, machineList.filter(item => item.totalAmount !== item.releasedAmount))
      const notClaimList = machineList.filter(
        (item) => item.totalAmount !== item.releasedAmount
      )
      setIsClaimingIDX(true)

      const multiContractsCalls = notClaimList.map((item) => ({
        address: MiningMachineProductionLogicAddress as `0x${string}`,
        abi: MiningMachineProductionLogicABI,
        functionName: 'claimReleasedIdx',
        args: [item.id],
        onConfirmed: (receipt: TransactionReceipt, index: number) => {
          // 这里可以执行其他操作，比如更新UI或触发下一个操作
          console.log(`Approval confirmed for call ${index + 1}`)
        }
      }))

      const res = await executeSequentialCalls(multiContractsCalls)
      setIsClaimingIDX(false)
      const extractedIdxAmount = res.reduce((acc, cur, index) => {
        if (cur.success) {
          acc += notClaimList[index].releasableAmount
        }
        return acc
      }, 0)
      const isAtLeastOneSuccess = res.find((item) => item.success)

      if (isAtLeastOneSuccess) {
        handleQuery()
        Modal.show({
          bodyStyle: {
            background: '#000000',
            color: '#ffffff',
            width: '75vw',
            padding: '15px',
            borderRadius: '20px'
          },
          showCloseButton: true,
          closeOnMaskClick: true,
          content: (
            <div className="pt-[15px] text-white text-[15px] flex flex-col gap-4">
              <div className="text-[#B195FF]">提示</div>
              <div>
                <div className="mb-4">
                  你已成功提取
                  <AdaptiveNumber
                    type={NumberType.BALANCE}
                    value={extractedIdxAmount}
                    decimalSubLen={2}
                    className="font-bold text-[15px]"
                  />
                  IDX，已存入你的钱包中。
                </div>
                <button
                  className="w-full bg-[#895EFF] rounded-3xl text-white py-2"
                  onClick={handleCloseModal}
                >
                  确认
                </button>
              </div>
            </div>
          )
        })
      }
    } catch (error) {
      console.error(error)
      setIsClaimingIDX(false)
    }
  }
  const handlBack = () => {
    navigate('/user')
  }

  // 动态计算高度
  useEffect(() => {
    if (!listContainerRef.current) return

    const calculateHeight = () => {
      const windowHeight = window.innerHeight
      const topSectionHeight = 435
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
    <div className="px-[21px]">
      <div className="flex pt-4 mb-4">
        <Button
          onClick={handlBack}
          className="!p-[0] !rounded-2xl"
          loading={isExchangingIDX}
        >
          <img src={arrowSvg} alt="" />
        </Button>
        <span className="m-auto text-[19px] font-bold">兑换IDX</span>
      </div>

      <div
        style={{
          background: '#000',
          width: '100%',
          padding: '12px 20px',
          gap: '5px',
          borderRadius: '24px',
          color: '#fff'
        }}
      >
        <div className="text-[12px]">待兑换MIX</div>

        <div className="pl-1 flex items-center justify-between">
          <div className="">
            <div className="flex   text-white items-center mt-4">
              <AdaptiveNumber
                type={NumberType.BALANCE}
                value={mixBalance}
                decimalSubLen={2}
                className="ml-2 mr-1.5  font-bold text-[22px]"
              />
              <div className="text-[11px] pt-[8px] ">MIX</div>
            </div>

            <div className="pl-2 text-[#939393] flex gap-1 items-center">
              ≈
              <AdaptiveNumber
                type={NumberType.BALANCE}
                value={(+mixBalance / 2) * +usdtToIdxRate}
                decimalSubLen={2}
                className="text-[16px] "
              />
              IDX
            </div>
          </div>

          <Button
            disabled={isExchangingIDX}
            onClick={handleExchangeMixToIDX}
            className=" !bg-[#7334FE] !rounded-2xl  !mb-2 !flex !items-center  !text-[13px] !text-white !border-none"
          >
            <div className="flex gap-2">
              兑换
              <img src={whiteExchangeSvg} alt="" width={10} />
            </div>
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-[15px] mt-2">
        <div className="">
          <div className="flex flex-col items-center">
            <div className="text-[.6875rem]">可提取IDX：</div>
            <div className="pl-2 my-2">
              <AdaptiveNumber
                type={NumberType.BALANCE}
                value={idxToBeClaimed}
                decimalSubLen={2}
                className="text-[1.5rem] font-bold mr-0.5"
              />
            </div>
          </div>

          <Button
            disabled={idxToBeClaimed === 0 || isExchangingIDX}
            loading={isClaimingIDX}
            onClick={handleClaimIDX}
            className="w-full !py-2 !bg-[#7334FE] !rounded-2xl !text-[14px]  !mb-2 !flex !items-center !justify-center  !text-white !border-none"
          >
            提取到钱包
          </Button>

          <div className="flex mt-4">
            <div className="flex-1 flex flex-col items-end">
              <div>剩余未释放数量</div>
              <div className="pl-2">
                <AdaptiveNumber
                  type={NumberType.BALANCE}
                  value={remainingAmount}
                  decimalSubLen={2}
                  className="text-[1rem] font-bold mr-1.5"
                />
                IDX
              </div>
            </div>

            <Divider
              direction="vertical"
              style={{
                color: '#1677ff',
                borderColor: '#bdbdbd',
                height: '40px'
              }}
            />
            <div className="flex-1 flex-col items-start">
              <div>已释放数量</div>
              <div className="pl-2">
                <AdaptiveNumber
                  type={NumberType.BALANCE}
                  value={releasedAmount}
                  decimalSubLen={2}
                  className="text-[1rem] font-bold mr-1.5"
                />
                IDX
              </div>
            </div>
          </div>
        </div>

        <Divider />

        <div
          ref={listContainerRef}
          style={{ height: `${listHeight}px` }}
          className="no-scrollbar"
        >
          {machineList.length > 0 ? (
            <List
              height={listHeight}
              width="100%"
              itemCount={machineList.length}
              itemSize={70}
              itemData={machineList}
            >
              {Row}
            </List>
          ) : (
            <EmptyComp />
          )}
        </div>
      </div>
    </div>
  )
}

const Row = memo(
  ({
    index,
    style,
    data
  }: {
    data: IReleaseInfo[]
    index: number
    style: React.CSSProperties
  }) => {
    const item = data[index]
    return (
      <div
        style={{
          ...style,
          height: '70px'
        }}
      >
        <div className="flex text-[12px] items-center gap-2">
          <img src={blackExchangeSvg} alt="" width={37} height={37} />

          <div className="w-full">
            <div className="flex justify-between">
              <div className="font-bold">兑换IDX</div>
              <div className="flex items-center">
                <AdaptiveNumber
                  type={NumberType.BALANCE}
                  value={item.totalAmount}
                  decimalSubLen={4}
                  className="ml-2 mr-1.5  font-bold "
                />
              </div>
            </div>

            <div className="flex justify-between mt-0.5">
              <div className="text-[#7E7878] text-[.625rem]">
                {formatTime(item.startTime)}
              </div>
              <div className="flex">
                已释放：
                <div>
                  <AdaptiveNumber
                    type={NumberType.BALANCE}
                    value={item.releasedAmount}
                    decimalSubLen={4}
                    className="ml-2 font-bold "
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <Divider />
      </div>
    )
  }
)

export default ExchangeIdx
