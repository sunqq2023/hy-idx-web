import { arrowSvg } from '@/assets'
import { Button, Divider, TextArea, Toast } from 'antd-mobile'
import { SHA256 } from 'crypto-js'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FixedSizeList as List } from 'react-window'
import { MachineInfo } from '@/constants/types'
import { validateAddressFnMap } from '@/utils/validateAddress'
import {
  waitForTransactionReceipt,
  writeContract,
  readContract
} from '@wagmi/core'
import config from '@/proviers/config'
import {
  CHAIN_ID,
  MiningMachineSystemLogicABI,
  MiningMachineSystemLogicAddress
} from '@/constants'
import LoadingButton from '@/components/LoadingButton'
import { formatEther } from 'viem'

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

const UserTransferMachine = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const pageData = location.state
  // console.log('user transfer machine', pageData)

  const [receiveAddress, setReceiveAddress] = useState('')

  const [transferLoading, setTransferLoading] = useState(false)

  const handlBack = () => {
    navigate('/user/toBeActivatedMachine')
  }

  const [listHeight, setListHeight] = useState(0)
  const listContainerRef = useRef<HTMLDivElement>(null)

  const [usdtToIdxRate, setUsdtToIdxRate] = useState(0)

  // 动态计算高度
  useEffect(() => {
    if (!listContainerRef.current) return

    const calculateHeight = () => {
      const windowHeight = window.innerHeight
      const topSectionHeight = 540
      const newHeight = windowHeight - topSectionHeight
      setListHeight(newHeight)
    }

    // 初始化计算
    calculateHeight()

    // 监听窗口变化（如旋转屏幕、键盘弹出等）
    window.addEventListener('resize', calculateHeight)
    return () => window.removeEventListener('resize', calculateHeight)
  }, [])

  const handleTransferOut = async () => {
    // 检查矿机数量是否超过30台
    if (pageData && pageData.length > 30) {
      Toast.show({
        content: '最多只能转让30台矿机',
        position: 'center',
        duration: 2000
      })
      return
    }

    const isValid = validateAddressFnMap?.['EVM']?.(receiveAddress)

    if (!isValid) {
      Toast.show({
        content: '请输入合法的BNB地址',
        position: 'center',
        duration: 2000
      })
      return
    }

    try {
      const ids = pageData.map((e: MachineInfo) => {
        return e.id
      })

      Toast.show({
        content: '转让中...',
        position: 'center',
        duration: 0
      })

      setTransferLoading(true)

      const res = await writeContract(config, {
        address: MiningMachineSystemLogicAddress,
        abi: MiningMachineSystemLogicABI,
        functionName: 'createInternalMachineOrder',
        args: [receiveAddress, ids]
      })

      await waitForTransactionReceipt(config, {
        hash: res,
        chainId: CHAIN_ID
      })
      Toast.clear()
      handlBack()
    } catch (error) {
      console.error(error)
    } finally {
      setTransferLoading(false)
    }
  }

  const handleChangeAddress = (value: string) => {
    setReceiveAddress(value)
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
      // console.log('rate', rate)
      setUsdtToIdxRate(+rate)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    getUsdtToIdxRate()
  }, [])

  const paymentToBeReceived = pageData.reduce((acc, cur) => {
    const totalUSD = 150 * (1 - cur.producedHours / 360) - 30
    let totalIDX = totalUSD * usdtToIdxRate
    if (totalIDX < 0) {
      totalIDX = 0
    }
    return acc + totalIDX
  }, 0)

  const Row = ({
    index,
    style,
    data
  }: {
    data: MachineInfo[]
    index: number
    style: React.CSSProperties
  }) => {
    const item = data[index]

    const getMachineType = (producedHours: number) => {
      const result = 150 * (1 - producedHours / 360) - 30
      return result === 120 ? '新矿机' : '二手矿机'
    }

    const getMachineProfit = (producedHours: number) => {
      const totalUSD = 150 * (1 - producedHours / 360) - 30
      let totalIDX = totalUSD * usdtToIdxRate
      if (totalIDX < 0) {
        totalIDX = 0
      }
      return totalIDX
    }

    return (
      <div
        style={{
          ...style,
          height: '50px'
        }}
      >
        <div className="flex py-2 text-[12px]">
          <div className="w-[55px] ">{index + 1}</div>
          <div className="w-[100px] mr-[10px]">#{generateCode(item.id)}</div>
          <div className="w-[80px] mr-auto">
            {getMachineType(item.producedHours)}
          </div>

          <div
            className={`${
              getMachineProfit(item.producedHours) === 0 && 'text-[red]'
            }`}
          >
            {getMachineProfit(item.producedHours)} IDX
          </div>
        </div>
        <Divider className="!my-[0]" />
      </div>
    )
  }

  return (
    <div>
      <div className="h-full overflow-hidden px-[21px] text-[14px] relative">
        <div className="flex pt-4">
          <Button
            onClick={handlBack}
            className="!p-[0] !rounded-2xl"
            loading={transferLoading}
          >
            <img src={arrowSvg} alt="" />
          </Button>
          <span className="m-auto text-[17px] font-bold text-black">
            转让矿机
          </span>
        </div>

        <div className="transfer-container mt-4">
          <div className="text-[14px] font-bold mb-4 text-black">
            接收方钱包地址
          </div>
          <TextArea
            value={receiveAddress}
            rows={2}
            className="bg-[#ececee] rounded-3xl p-3"
            placeholder="输入对方的钱包地址"
            onChange={handleChangeAddress}
            style={{
              '--font-size': '14px'
            }}
          />
        </div>

        <div className="transfer-container mt-4 text-[14px]">
          <div className="flex items-center justify-between mb-2">
            <div className=" font-bold  text-black">待转让详情</div>
            <div className="text-[12px]">
              共计：
              <span className={`mr-2 text-[18px] font-bold ${pageData.length > 30 ? 'text-red-500' : 'text-black'}`}>
                {pageData.length}
              </span>
              台
              {pageData.length > 30 && (
                <span className="text-red-500 text-xs ml-1">
                  （超过最大限制<strong>30</strong>台）
                </span>
              )}
            </div>
          </div>
          <div className="flex justify-between text-[11px] mb-4">
            (每台手续费30U等值IDX)
          </div>

          <Divider className="!mt-[10px] !mb-[0]" />

          <div className="flex justify-between py-2 text-[#777777] text-[12px]">
            <div>#</div>
            <div>矿机编号</div>
            <div>矿机类型</div>
            <div>每台收益</div>
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
              itemCount={pageData.length}
              itemSize={50}
              itemData={pageData}
            >
              {Row}
            </List>
          </div>
        </div>
      </div>
      <div className="w-full bg-white h-[4rem] flex items-center absolute bottom-0 px-[30px]">
        <div>
          <div>待收款 IDX</div>
          <div className="text-[#FF6D6D] text-[22px]">
            {paymentToBeReceived}
          </div>
        </div>

        <Button
          className={`!rounded-3xl !ml-auto !h-[40px] !w-[100px] ${
            pageData.length > 30 
              ? '!bg-gray-300 !text-gray-500 cursor-not-allowed' 
              : '!bg-black !text-white'
          }`}
          style={{
            fontSize: '15px'
          }}
          onClick={handleTransferOut}
          loading={transferLoading}
          disabled={pageData.length > 30}
        >
          转出矿机
        </Button>
      </div>
    </div>
  )
}

export default UserTransferMachine
    