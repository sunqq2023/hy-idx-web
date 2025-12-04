import { arrowSvg } from '@/assets'
import { Button, Divider, TextArea, Toast } from 'antd-mobile'
import { SHA256 } from 'crypto-js'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FixedSizeList as List } from 'react-window'
import { MachineInfo } from '@/constants/types'
import { validateAddressFnMap } from '@/utils/validateAddress'
import {
  waitForTransactionReceipt,
  writeContract,
  readContract,
  multicall
} from '@wagmi/core'
import config from '@/proviers/config'
import {
  CHAIN_ID,
  MiningMachineSystemLogicABI,
  MiningMachineSystemLogicAddress,
  MiningMachineSystemStorageABI,
  MiningMachineSystemStorageAddress
} from '@/constants'
import LoadingButton from '@/components/LoadingButton'
import { formatEther } from 'viem'
import AdaptiveNumber, { NumberType } from '@/components/AdaptiveNumber'

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

const TransferMachine = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const pageData: MachineInfo[] = location.state

  const [receiveAddress, setReceiveAddress] = useState('')

  const [transferLoading, setTransferLoading] = useState(false)

  const handlBack = () => {
    navigate('/sale-person')
  }

  const [listHeight, setListHeight] = useState(0)
  const listContainerRef = useRef<HTMLDivElement>(null)

  const [usdtToIdxRate, setUsdtToIdxRate] = useState(0)
  const [motherPrice, setMotherPrice] = useState(0)

  // 动态计算高度
  useEffect(() => {
    if (!listContainerRef.current) return

    const calculateHeight = () => {
      const windowHeight = window.innerHeight
      const topSectionHeight = 450
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
        content: '转出中...',
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

      // 完成后返回到主页
      navigate('/sale-person')
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
      setUsdtToIdxRate(+rate)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    getUsdtToIdxRate()
  }, [])

  const queryMotherMachinePrice = useCallback(async () => {
    try {
      const machineId = pageData[0].id
      const res = await readContract(config, {
        address: MiningMachineSystemStorageAddress,
        abi: MiningMachineSystemStorageABI,
        functionName: 'motherMachinePrices',
        args: [machineId]
      })
      setMotherPrice(Number(res))
    } catch (error) {
      console.error(error)
    }
  }, [pageData])

  useEffect(() => {
    queryMotherMachinePrice()
  }, [queryMotherMachinePrice])

  return (
    <div className="">
      <div className="h-full overflow-hidden px-[21px] text-[16px] relative">
        <div className="flex">
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

        <div className="transfer-container mt-2">
          <div className="text-[16px] font-bold mb-2 text-black">
            接收方钱包地址
          </div>
          <TextArea
            value={receiveAddress}
            rows={2}
            className="bg-[#ececee] rounded-3xl p-3"
            placeholder="输入对方的钱包地址"
            onChange={handleChangeAddress}
          />
        </div>

        <div className="transfer-container mt-2">
          <div className="text-[16px] font-bold mb-2 text-black">
            待转让详情
          </div>
          <div className="flex justify-between">
            <div>
              单价：
              <span className="font-bold text-black mr-1">
                <AdaptiveNumber
                  type={NumberType.BALANCE}
                  value={motherPrice * usdtToIdxRate}
                  decimalSubLen={2}
                  className="font-bold"
                />
              </span>
              IDX/台
            </div>
            <div className="">
              共计：
              <span className="mr-2 text-[18px] font-bold text-black">
                {pageData.length}
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
              itemCount={pageData.length}
              itemSize={50}
              itemData={pageData}
            >
              {Row}
            </List>
          </div>
        </div>
      </div>
      <div className="w-full bg-white h-[4rem] flex items-center absolute bottom-0 px-[1.875rem]">
        <div>
          <div>买家待支付 IDX</div>
          <div className="text-[#FF6D6D] text-[22px]">
            <AdaptiveNumber
              type={NumberType.BALANCE}
              value={motherPrice * pageData.length * usdtToIdxRate}
              decimalSubLen={2}
              className="font-bold"
            />
          </div>
        </div>

        <Button
          className="!bg-black !text-white !rounded-3xl !ml-auto   !py-2 !w-[100px]"
          style={{
            fontSize: '14px'
          }}
          loading={transferLoading}
          onClick={handleTransferOut}
        >
          转出矿机
        </Button>
      </div>
    </div>
  )
}

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

export default TransferMachine
