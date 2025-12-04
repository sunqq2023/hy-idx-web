import {
  chainsSvgs,
  gasSvg,
  idxBackgroundSvg,
  selectedSvg,
  usdtSvg
} from '@/assets'
import {
  Button,
  Checkbox,
  Divider,
  ErrorBlock,
  Skeleton,
  Tabs,
  Toast
} from 'antd-mobile'
import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import config from '@/proviers/config'
import { FixedSizeList as List } from 'react-window'
import { useNavigate, useLocation } from 'react-router-dom'
import styles from './Home.module.css'
import UserPageCheckableItem from './UserPageCheckableItem'
import { MachineInfo } from '@/constants/types'
import { useAccount, useWriteContract } from 'wagmi'
import { readContract, multicall, getBalance, writeContract, waitForTransactionReceipt } from '@wagmi/core'
import { erc20Abi, formatEther, formatUnits, parseEther } from 'viem'
import AdaptiveNumber, { NumberType } from '@/components/AdaptiveNumber'
import {
  CHAIN_ID,
  IDX_CONTRACTS_ADDRESS,
  MiningMachineProductionLogicABI,
  MiningMachineProductionLogicAddress,
  MiningMachineSystemStorageABI,
  MiningMachineSystemStorageAddress,
  USDT_CONTRACTS_ADDRESS,
  MiningMachineSystemStorageExtendABI,
  MiningMachineSystemStorageExtendAddress,
  MiningMachineSystemLogicExtendABI,
  MiningMachineSystemLogicExtendAddress
} from '@/constants'
import EmptyComp from '@/components/EmptyComp'

interface HomeProps {
  onStudioStatusChange?: (isStudio: boolean) => void
  onStudioMarkerStatusChange?: (canMarkStudio: boolean) => void
}

export const Home = ({ onStudioStatusChange, onStudioMarkerStatusChange }: HomeProps) => {
  const [machineList, setMachineList] = useState<MachineInfo[]>([])
  const [allList, setAllList] = useState<MachineInfo[]>([])
  const [startedList, setStartedList] = useState<MachineInfo[]>([])
  const [notTurnedOnList, setNotTurnedOnList] = useState<MachineInfo[]>([])

  const [allStatus, setAllStatus] = useState(false)
  const [isStudio, setIsStudio] = useState(false) // 是否为工作室账户
  const [canMarkStudio, setCanMarkStudio] = useState(false) // 是否可以标记工作室
  const [isLoadingStudio, setIsLoadingStudio] = useState(false) // 加载工作室状态

  const [listHeight, setListHeight] = useState(0)
  const listContainerRef = useRef<HTMLDivElement>(null)

  const [fuelList, setFuelList] = useState<MachineInfo[]>([])

  const navigate = useNavigate()
  const location = useLocation()  // 添加路由位置监听

  const [tabs, setTabs] = useState(['全部(0)', '已启动(0)', '未开机(0)'])
  const [tabKey, setTabKey] = useState('0')

  const { address: userAddress } = useAccount()
  const { writeContractAsync } = useWriteContract()

  // 检查工作室状态
  const checkStudioStatus = useCallback(async () => {
    if (!userAddress) return

    try {
      setIsLoadingStudio(true)
      
      // 检查是否为工作室
      const isStudioResult = await readContract(config, {
        address: MiningMachineSystemStorageExtendAddress as `0x${string}`,
        abi: MiningMachineSystemStorageExtendABI,
        functionName: 'checkIfStudio',
        args: [userAddress]
      })
      
      // 检查是否为工作室标记者
      const canMarkStudioResult = await readContract(config, {
        address: MiningMachineSystemStorageExtendAddress as `0x${string}`,
        abi: MiningMachineSystemStorageExtendABI,
        functionName: 'checkStudioMarker',
        args: [userAddress]
      })
      
      const studioStatus = Boolean(isStudioResult)
      const markerStatus = Boolean(canMarkStudioResult)
      
      setIsStudio(studioStatus)
      setCanMarkStudio(markerStatus)
      onStudioStatusChange?.(studioStatus)
      onStudioMarkerStatusChange?.(markerStatus)
    } catch (error) {
      console.error('检查工作室状态失败:', error)
      setIsStudio(false)
      setCanMarkStudio(false)
      onStudioStatusChange?.(false)
      onStudioMarkerStatusChange?.(false)
    } finally {
      setIsLoadingStudio(false)
    }
  }, [userAddress, onStudioStatusChange, onStudioMarkerStatusChange])

  const [bnbBalance, setBnbBalance] = useState('')
  const [idxBalance, setIdxBalance] = useState('')
  const [usdtBalance, setUsdtBalance] = useState('')
  const [mixBalance, setMixBalance] = useState(0)

  const [isLoading, setIsLoading] = useState(false)

  const [mixPointsToBeClaimed, setMixPointsToBeClaimed] = useState(0)
  const [manageMachineCount, setManageMachineCount] = useState(0)

  // 空投相关状态
  const [airdropAddress, setAirdropAddress] = useState('')
  const [airdropAmount, setAirdropAmount] = useState('')
  const [hasAirdropPermission, setHasAirdropPermission] = useState(false)
  const [isAirdropping, setIsAirdropping] = useState(false)
  const [showAirdropForm, setShowAirdropForm] = useState(false)

  // 空投矿机相关状态
  const [machineAirdropAddress, setMachineAirdropAddress] = useState('')
  const [machineAirdropCount, setMachineAirdropCount] = useState('')
  const [hasMachineAirdropPermission, setHasMachineAirdropPermission] = useState(false)
  const [isMachineAirdropping, setIsMachineAirdropping] = useState(false)
  const [showMachineAirdropForm, setShowMachineAirdropForm] = useState(false)

  // 检查空投权限
  const checkAirdropPermission = useCallback(async () => {
    if (!userAddress) return
    
    try {
      const hasPermission = await readContract(config, {
        address: MiningMachineSystemStorageExtendAddress as `0x${string}`,
        abi: MiningMachineSystemStorageExtendABI,
        functionName: 'airdroperAddresses',
        args: [userAddress]
      })
      setHasAirdropPermission(hasPermission as boolean)
    } catch (error) {
      console.error('检查空投权限失败:', error)
      setHasAirdropPermission(false)
    }
  }, [userAddress])

  // 检查空投矿机权限
  const checkMachineAirdropPermission = useCallback(async () => {
    if (!userAddress) return
    
    try {
      console.log('=== 检查空投矿机权限 ===')
      console.log('用户地址:', userAddress)
      console.log('合约地址:', MiningMachineSystemStorageExtendAddress)
      console.log('检查函数: checkIfmachineTransfer')
      
      const hasPermission = await readContract(config, {
        address: MiningMachineSystemStorageExtendAddress as `0x${string}`,
        abi: MiningMachineSystemStorageExtendABI,
        functionName: 'checkIfmachineTransfer',
        args: [userAddress]
      })
      
      console.log('权限检查结果:', hasPermission)
      setHasMachineAirdropPermission(hasPermission as boolean)
    } catch (error) {
      console.error('=== 检查空投矿机权限失败 ===')
      console.error('错误详情:', error)
      setHasMachineAirdropPermission(false)
    }
  }, [userAddress])

  // 检查空投权限
  useEffect(() => {
    checkAirdropPermission()
    checkStudioStatus()
  }, [checkAirdropPermission, checkStudioStatus])

  // 检查空投矿机权限
  useEffect(() => {
    checkMachineAirdropPermission()
  }, [checkMachineAirdropPermission])

  // query user balance
  const handleQueryUserBalance = useCallback(async () => {
    if (!userAddress) return
    
    try {
      const data = await getBalance(config, {
        address: userAddress,
        chainId: CHAIN_ID
      })
      const bnbBalance = formatUnits(data.value, data.decimals)
      setBnbBalance(bnbBalance)

      const contracts = [
        {
          address: IDX_CONTRACTS_ADDRESS,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [userAddress]
        },
        {
          address: USDT_CONTRACTS_ADDRESS,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [userAddress]
        },
        {
          address: MiningMachineSystemStorageAddress,
          abi: MiningMachineSystemStorageABI,
          functionName: 'mixBalances',
          args: [userAddress]
        }
      ]

      const result = await multicall(config, {
        contracts
      })

      setIdxBalance(result[0].result ? formatEther(result[0].result) : '0')
      setUsdtBalance(result[1].result ? formatEther(result[1].result) : '0')
      setMixBalance(Number(result[2].result ? formatEther(result[2].result) : '0'))
    } catch (error) {
      console.error(error)
    }
  }, [userAddress])

  useEffect(() => {
    handleQueryUserBalance()
  }, [handleQueryUserBalance])

  useEffect(() => {
    if (allStatus) {
      setFuelList(machineList)
    }

    if (machineList.length === fuelList.length && fuelList.length > 0) {
      setAllStatus(true)
    }
  }, [allStatus, machineList, fuelList])

  const toggleSelectAll = () => {
    setMachineList((prevList) => {
      const newList = prevList.map((item) => {
        return {
          ...item,
          checked: !allStatus
        }
      })

      if (!allStatus) {
        setFuelList(newList)
      } else {
        setFuelList([])
      }

      return newList
    })

    setAllStatus(!allStatus)
  }

  const handleLeftClick = useCallback(
    (item: MachineInfo) => {
      setMachineList((prevItems) => {
        const newItems = prevItems.map((e) => {
          return e.id === item.id ? { ...e, checked: !e.checked } : e
        })

        const isItemChecked = !item.checked
        if (isItemChecked) {
          if (allStatus) {
            setFuelList(machineList)
          } else {
            setFuelList([...fuelList, item])
          }
        } else {
          const list = fuelList.filter((e) => e.id !== item.id)
          setFuelList(list)
          setAllStatus(false)
        }

        return newItems
      })
    },
    [allStatus, machineList, fuelList]
  )

  const handleQuery = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await readContract(config, {
        address: MiningMachineSystemStorageAddress,
        abi: MiningMachineSystemStorageABI,
        functionName: 'getOwnerToMachineIds',
        args: [userAddress]
      })
      const bignumToNumber = (data as bigint[]).map((e) => Number(e))

      const contracts = bignumToNumber.map((e) => {
        return {
          address: MiningMachineSystemStorageAddress,
          abi: MiningMachineSystemStorageABI,
          functionName: 'getMachineLifecycle',
          args: [e]
        }
      })
      const data2 = await multicall(config, {
        contracts
      })
      const result = data2.map((e, i) => {
        return {
          activatedAt: Number(e.result.activatedAt),
          createTime: Number(e.result.createTime),
          expiredAt: Number(e.result.expiredAt),
          destroyed: e.result.destroyed,
          isActivatedStakedLP: e.result.isActivatedStakedLP,
          isFuelPaid: e.result.isFuelPaid,
          isProducing: e.result.isProducing,
          mtype: e.result.mtype,
          checked: false,
          status: e.status,
          id: bignumToNumber[i],
          lastProduceTime: Number(e.result.lastProduceTime),
          producedChildCount: Number(e.result.producedChildCount),
          producedHours: Number(e.result.producedHours),
          fuelRemainingMinutes: Number(e.result.fuelRemainingMinutes)
        }
      })

      const childListResult = result.filter(
        (e) => e.mtype === 2 && e.isActivatedStakedLP
      )

      // 获取子矿机生命剩余
      const remainingContract = childListResult.map((item) => {
        return {
          address: MiningMachineProductionLogicAddress,
          abi: MiningMachineProductionLogicABI,
          functionName: 'viewMachineProduction',
          args: [item.id]
        }
      })

      const data3 = await multicall(config, {
        contracts: remainingContract
      })

      const result3 = childListResult.map((item, i) => {
        if (data3[i].status === 'success') {
          return {
            ...item,
            unclaimedChildCount: Number(data3[i].result[2]),
            producedMix: Number(data3[i].result[3]),
            unclaimedMix: Number(data3[i].result[5])
          }
        }
        return {
          ...item,
          unclaimedChildCount: 0,
          producedMix: 0,
          unclaimedMix: 0
        }
      })

      const contractsWithOnSale = result.map((item) => ({
        address: MiningMachineSystemStorageAddress,
        abi: MiningMachineSystemStorageABI,
        functionName: '_isOnSale',
        args: [item.id]
      }))

      const dataWithOnSale = await multicall(config, {
        contracts: contractsWithOnSale
      })

      const resultWithOnSale = result.map((item, i) => ({
        ...item,
        isOnSale: dataWithOnSale[i].result
      }))

      let motherAndChildList = resultWithOnSale.filter((e) => {
        if (e.mtype === 1) {
          return !e.isOnSale
        } else if (e.mtype === 2) {
          return !e.isActivatedStakedLP && !e.isOnSale
        }
      })
      motherAndChildList = motherAndChildList.filter((e) => !e.destroyed)
      setManageMachineCount(motherAndChildList.length)

      const allCliamMix = result3.reduce((acc, cur) => {
        return acc + cur.unclaimedMix
      }, 0)

      setMixPointsToBeClaimed(+formatEther(BigInt(allCliamMix)))

      // 关键：根据最新的isProducing状态更新列表
      const activeMachines = result3.filter((e) => e.isProducing && e.isActivatedStakedLP)
      const inactiveMachines = result3.filter((e) => 
  !e.isProducing && 
  e.isActivatedStakedLP && 
  !e.destroyed && 
  e.expiredAt > Date.now() / 1000  // 排除生命周期已结束的矿机（时间戳单位为秒）
);
      
      setStartedList(activeMachines)
      setNotTurnedOnList(inactiveMachines)
      setAllList(result3)
      
      // 更新标签计数
      setTabs([
        `全部(${result3.length})`,
        `已启动(${activeMachines.length})`,
        `未开机(${inactiveMachines.length})`
      ])

      // 根据当前选中的标签页更新显示列表
      if (tabKey === '0') setMachineList(result3)
      if (tabKey === '1') setMachineList(activeMachines)
      if (tabKey === '2') setMachineList(inactiveMachines)

    } catch (error) {
      console.log(error)
    } finally {
      setIsLoading(false)
    }
  }, [userAddress, tabKey])

  // 初始加载数据
  useEffect(() => {
    handleQuery()
  }, [handleQuery])

  // 监听刷新信号并重新加载数据
  useEffect(() => {
    const { state } = location;
    // 如果收到需要刷新的信号
    if (state?.needRefresh) {
      handleQuery().then(() => {
        // 清除信号，使用replace避免历史记录问题
        navigate(location.pathname, {
          state: { ...state, needRefresh: false },
          replace: true
        });
      });
    }
    // 当从矿机详情页返回时也刷新数据（作为备选方案）
    else if (state?.fromMachineDetail) {
      handleQuery().then(() => {
        navigate(location.pathname, {
          state: { ...state, fromMachineDetail: false },
          replace: true
        });
      });
    }
  }, [location, handleQuery, navigate]);

  useEffect(() => {
    if (fuelList.length === machineList.length && fuelList.length > 0) {
      setAllStatus(true)
    } else {
      setAllStatus(false)
    }
  }, [fuelList.length, machineList.length])

  const handleRightClick = (item: MachineInfo) => {
    console.log('跳转的矿机ID:', item.id);
    navigate('/user/machineDetail', { state: { id: item.id, ...item } });
  }

  const Row = memo(
    ({
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
            height: '70px'
          }}
        >
          <UserPageCheckableItem
            item={item}
            onLeftClick={handleLeftClick}
            onRightClick={handleRightClick}
          />
        </div>
      )
    }
  )

  // 动态计算高度
  useEffect(() => {
    if (!listContainerRef.current) return
    const calculateHeight = () => {
      const windowHeight = window.innerHeight
      const topSectionHeight = 100
      const newHeight = windowHeight - topSectionHeight
      setListHeight(newHeight)
    }

    // 初始化计算
    calculateHeight()

    // 监听窗口变化
    window.addEventListener('resize', calculateHeight)
    return () => window.removeEventListener('resize', calculateHeight)
  }, [])

  const handleAddFuel = async () => {
    if (fuelList.length === 0) {
      Toast.show({
        content: '请选择要添加燃料的矿机',
        position: 'center',
        duration: 2000
      })
      return
    }

    navigate('/user/addFuel', { state: fuelList })
  }

  const getChekeIcon = (checked: boolean): React.ReactNode =>
    checked ? (
      <img src={selectedSvg} alt="" width={16} height={16} />
    ) : (
      <div className="border border-[#a5a4a4] w-[1rem] h-[1rem] rounded-[50%]" />
    )

  const handleToBeActivatedClick = () => {
    navigate('/user/toBeActivatedMachine')
  }

  const handleClaimMix = useCallback(async () => {
    navigate('/user/claimMix', {
      state: {
        machineList,
        mixPointsToBeClaimed
      }
    })
  }, [machineList, mixPointsToBeClaimed, navigate])

  const handleMixBillClick = () => {
    navigate('/user/mixBill')
  }

  const handleExchangeIdxClick = () => {
    navigate('/user/exchangeIdx')
  }

  const handleSyntheticMachine = () => {
    navigate('/user/syntheticMachine')
  }

  // 空投处理函数
  const handleAirdrop = async () => {
    if (!airdropAddress || !airdropAmount) {
      Toast.show({
        content: '请输入地址和数量',
        position: 'center',
        duration: 2000
      })
      return
    }

    const amount = parseFloat(airdropAmount)
    const currentIdxBalance = parseFloat(idxBalance)

    if (amount <= 0) {
      Toast.show({
        content: '数量必须大于0',
        position: 'center',
        duration: 2000
      })
      return
    }

    if (amount > currentIdxBalance) {
      Toast.show({
        content: '数量不能大于当前IDX余额',
        position: 'center',
        duration: 2000
      })
      return
    }

    try {
      setIsAirdropping(true)
      const hash = await writeContractAsync({
        address: MiningMachineSystemLogicExtendAddress as `0x${string}`,
        abi: MiningMachineSystemLogicExtendABI,
        functionName: 'airdrop',
        args: [airdropAddress, airdropAmount]
      })

      await waitForTransactionReceipt(config, {
        hash,
        chainId: CHAIN_ID
      })

      Toast.show({
        content: '空投成功',
        position: 'center'
      })

      // 重置表单
      setAirdropAddress('')
      setAirdropAmount('')
      setShowAirdropForm(false)

      // 刷新余额
      handleQueryUserBalance()
    } catch (error) {
      Toast.show({
        content: '空投失败',
        position: 'center'
      })
      console.error('Airdrop failed:', error)
    } finally {
      setIsAirdropping(false)
    }
  }

  // 空投矿机处理函数
  const handleMachineAirdrop = async () => {
    if (!machineAirdropAddress || !machineAirdropCount) {
      Toast.show({
        content: '请输入地址和数量',
        position: 'center',
        duration: 2000
      })
      return
    }

    const count = parseInt(machineAirdropCount)

    if (count <= 0) {
      Toast.show({
        content: '数量必须大于0',
        position: 'center',
        duration: 2000
      })
      return
    }

    if (count > 100) {
      Toast.show({
        content: '数量不能大于100',
        position: 'center',
        duration: 2000
      })
      return
    }

    try {
      setIsMachineAirdropping(true)
      
      console.log('=== 开始空投矿机 ===')
      console.log('目标地址:', machineAirdropAddress)
      console.log('空投数量:', count)
      console.log('合约地址:', MiningMachineSystemLogicExtendAddress)
      
      const hash = await writeContractAsync({
        address: MiningMachineSystemLogicExtendAddress as `0x${string}`,
        abi: MiningMachineSystemLogicExtendABI,
        functionName: 'mintChildMachine',
        args: [machineAirdropAddress, BigInt(count)]
      })

      console.log('交易已发送，哈希:', hash)
      console.log('等待交易确认...')

      const receipt = await waitForTransactionReceipt(config, {
        hash,
        chainId: CHAIN_ID
      })

      console.log('=== 交易确认详情 ===')
      console.log('交易哈希:', receipt.transactionHash)
      console.log('区块号:', receipt.blockNumber)
      console.log('交易状态:', receipt.status)
      console.log('Gas使用量:', receipt.gasUsed?.toString())
      console.log('交易索引:', receipt.transactionIndex)
      console.log('日志数量:', receipt.logs?.length || 0)
      
      // 检查交易状态
      if (receipt.status === 'success') {
        console.log('✅ 交易执行成功')
        Toast.show({
          content: '空投矿机成功',
          position: 'center'
        })

        // 重置表单
        setMachineAirdropAddress('')
        setMachineAirdropCount('')
        setShowMachineAirdropForm(false)

        // 刷新数据
        handleQueryUserBalance()
      } else {
        console.log('❌ 交易执行失败，状态:', receipt.status)
        throw new Error(`交易执行失败，状态: ${receipt.status}`)
      }
    } catch (error) {
      console.error('=== 空投矿机失败详情 ===')
      console.error('错误类型:', error?.constructor?.name)
      console.error('错误消息:', error?.message)
      console.error('错误代码:', error?.code)
      console.error('完整错误对象:', error)
      
      // 根据错误类型显示不同的提示
      let errorMessage = '空投矿机失败'
      const errorObj = error as any
      if (errorObj?.name === 'UserRejectedRequestError' || errorObj?.code === 4001) {
        errorMessage = '用户取消操作'
      } else if (errorObj?.message?.includes('交易执行失败')) {
        errorMessage = '交易执行失败，请检查权限或参数'
      } else if (errorObj?.message?.includes('insufficient funds')) {
        errorMessage = 'Gas费不足'
      } else if (errorObj?.message?.includes('revert')) {
        errorMessage = '合约执行失败，请检查权限'
      }
      
      Toast.show({
        content: errorMessage,
        position: 'center',
        duration: 3000
      })
    } finally {
      setIsMachineAirdropping(false)
    }
  }

  const handleTabsChange = (key: string) => {
    setTabKey(key)
    if (key === '0') setMachineList(allList)
    if (key === '1') setMachineList(startedList)
    if (key === '2') setMachineList(notTurnedOnList)
  }

  return (
    <div className=" flex flex-col justify-between">
      <div className="px-[21px] ">
        <div className="bg-[#09090a] rounded-2xl text-white px-4 py-2 text-[1rem] relative">
          <div className="text-[#c6c6c6] text-[12px] font-[400] flex">
            钱包余额
          </div>

          <div className="flex mt-1 mb-1 items-center gap-1">
            <img src={usdtSvg} alt="" width={16} height={16} />
            <div className="text-[#c6c6c6] text-[10px] font-[400] w-[27px]">
              USDT
            </div>
            <div>
              <AdaptiveNumber
                type={NumberType.BALANCE}
                value={usdtBalance}
                decimalSubLen={2}
                className="ml-2 mr-1.5"
              />
            </div>
          </div>

          <div className="flex my-1 items-center  gap-1">
            <img src={chainsSvgs.bscSvg} alt="" width={16} height={16} />
            <span className="text-[#c6c6c6] text-[10px] font-[400] w-[27px]">
              BNB
            </span>
            <div>
              <AdaptiveNumber
                type={NumberType.BALANCE}
                value={bnbBalance}
                decimalSubLen={2}
                className="ml-2 mr-1.5"
              />
            </div>
          </div>

          <div className="flex  gap-1  mb-2 items-center">
            <div className="bg-[#895eff] rounded-[50%] text-[7px] flex items-center justify-center w-[16px] h-[16px]">
              IDX
            </div>
            <span className="text-[#c6c6c6] text-[10px] font-[400] w-[27px]">
              IDX
            </span>
            <div>
              <AdaptiveNumber
                type={NumberType.BALANCE}
                value={idxBalance}
                decimalSubLen={2}
                className="ml-2 mr-1.5  font-bold"
              />
            </div>
          </div>

          <img
            src={idxBackgroundSvg}
            alt=""
            width={71}
            height={87}
            className="absolute top-[2.5rem] right-[2.5rem]"
          />
        </div>

        <div className="bg-black rounded-2xl text-white p-4 text-[1rem] mt-2">
          <div className="flex justify-between">
            <div className="flex items-center">
              <div className="bg-[#0B8659] rounded-[50%] text-[7px] flex items-center justify-center  w-[16px] h-[16px]">
                MIX
              </div>
              <div>
                <AdaptiveNumber
                  type={NumberType.BALANCE}
                  value={mixBalance}
                  decimalSubLen={2}
                  className="ml-2 mr-1.5"
                />
                <span className="text-[#c6c6c6] text-[10px] font-[400]">
                  MIX
                </span>
              </div>
            </div>

            <div
              className="flex gap-2 text-[10px] items-center"
              onClick={handleMixBillClick}
            >
              账单
              <div className="w-[16px] h-[18px] bg-[#333] rounded-[50%] text-[.6875rem] flex items-center justify-center ">
                i
              </div>
            </div>
          </div>

          <div className="flex gap-2 text-[#c6c6c6] mt-4">
            <div
              onClick={handleSyntheticMachine}
              className="flex-[1] text-center bg-[#09090a] border border-[#212122] rounded-3xl py-1 text-[.7rem]"
            >
              合成矿机
            </div>
            <div
              onClick={handleExchangeIdxClick}
              className="flex-[1] text-center bg-[#09090a] border border-[#212122] rounded-3xl py-1 text-[.7rem]"
            >
              兑换IDX
            </div>
          </div>

          <div className="flex gap-2 text-[#c6c6c6] mt-2">
            {hasAirdropPermission && (
              <div
                onClick={() => setShowAirdropForm(true)}
                className="flex-[1] text-center border border-[#212122] rounded-3xl py-1 text-[.7rem] bg-[#09090a] cursor-pointer"
              >
                空投IDX
              </div>
            )}
            {hasMachineAirdropPermission && (
              <div
                onClick={() => setShowMachineAirdropForm(true)}
                className="flex-[1] text-center border border-[#212122] rounded-3xl py-1 text-[.7rem] bg-[#09090a] cursor-pointer"
              >
                空投矿机
              </div>
            )}
          </div>
        </div>

        <div className="flex mt-2 items-center   text-[#C7BEDF] gap-2">
          <Button
            onClick={handleClaimMix}
            className="flex-1/2 !bg-[#09090a] !rounded-2xl  !mb-2  !items-center  !py-1 "
          >
            <div className="flex flex-col !text-[#C7BEDF] ">
              <AdaptiveNumber
                type={NumberType.BALANCE}
                value={mixPointsToBeClaimed}
                decimalSubLen={2}
                className="ml-2 mr-1.5 text-[#895EFE] font-bold text-[1rem]"
              />
              <div className="text-[.75rem]">挖矿产出（MIX）</div>
            </div>
          </Button>

          <Button
            onClick={handleToBeActivatedClick}
            className="flex-1/2 !bg-[#09090a] !rounded-2xl  !mb-2  !items-center  !py-1 "
          >
            <div className="flex flex-col !text-[#C7BEDF] text-[.75rem]">
              <div className="ml-2 mr-1.5 text-[#895EFE] font-bold text-[1rem]">
                {manageMachineCount}
              </div>
              <div className="text-[.75rem]">矿机管理（个）</div>
            </div>
          </Button>
        </div>

        <div className="flex items-center">
          <div className="flex items-center">
            <Checkbox
              className="mr-6 h-[36px] "
              checked={allStatus}
              icon={(isChecked) => getChekeIcon(isChecked)}
              onClick={toggleSelectAll}
              style={{
                '--font-size': '12px',
                '--gap': '6px',
                padding: '8px 0 10px'
              }}
            >
              全选
            </Checkbox>

            <Divider
              direction="vertical"
              style={{
                borderColor: '#666',
                height: '15px'
              }}
            />
          </div>

          <Tabs
            activeKey={tabKey}
            onChange={handleTabsChange}
            style={{
              '--active-line-height': '0'
            }}
            className={`
                  ${styles['adm-tabs']}
                  !h-[40px] !shrink-0  
                  [&_.adm-tabs-tab-wrapper]:flex-none [&_.adm-tabs-tab-wrapper]:px-0  
                  [&_.adm-tabs-tab.adm-tabs-tab-active]:font-bold [&_.adm-tabs-tab.adm-tabs-tab-active]:opacity-100 
                  [&_.adm-tabs-tab]:text-[12px]
                  [&_.adm-tabs-tab]:pb-[11px] 
                  [&_.adm-tabs-tab]:pt-[14px] 
                  [&_.adm-tabs-tab]:opacity-40 [&_.adm-tabs-tab]:transition-transform
                `}
          >
            {tabs.map((tab, index) => (
              <Tabs.Tab key={index} title={tab} className="flex flex-col" />
            ))}
          </Tabs>
        </div>

        {/* 列表 */}

        <div
          ref={listContainerRef}
          style={{ height: `${listHeight}px` }}
          className="no-scrollbar mb-[4rem]"
        >
          {!isLoading ? (
            machineList.length > 0 ? (
              <List
                height={listHeight}
                width="100%"
                itemCount={machineList.length}
                itemSize={100}
                itemData={machineList}
              >
                {Row}
              </List>
            ) : (
              <EmptyComp />
            )
          ) : (
            <Skeleton.Paragraph
              lineCount={6}
              animated
              className={`customSkeleton`}
            />
          )}
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 w-full bg-white  py-[.75rem] flex items-center mt-auto px-[21px]"
        onClick={handleAddFuel}
      >
        {fuelList.length > 0 && (
          <div className="bg-[#F1F1F3] rounded-[50%] w-[32px] h-[32px] flex justify-center items-center text-[#895FFE] font-bold">
            {fuelList.length}
          </div>
        )}
        <div className="flex flex-col items-center justify-center  mx-auto">
          <img src={gasSvg} alt="" width={18} />
          <span className="text-[.8125rem] mt-1">添加燃料</span>
        </div>
      </div>

      {/* 空投表单弹窗 */}
      {showAirdropForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-4 mx-4 w-full max-w-sm">
            <div className="text-lg font-bold mb-4 text-center">空投IDX</div>
            
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">接收地址</div>
              <input
                type="text"
                placeholder="输入接收地址"
                value={airdropAddress}
                onChange={(e) => setAirdropAddress(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl text-sm"
              />
            </div>

            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">空投数量</div>
              <input
                type="number"
                placeholder="输入数量"
                value={airdropAmount}
                onChange={(e) => setAirdropAmount(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl text-sm"
              />
              <div className="text-xs text-gray-500 mt-1">
                当前余额: {idxBalance} IDX
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowAirdropForm(false)}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl text-sm font-medium"
              >
                取消
              </button>
              <button
                onClick={handleAirdrop}
                disabled={isAirdropping || !airdropAddress || !airdropAmount}
                className="flex-1 py-3 bg-[#895EFE] text-white rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAirdropping ? '空投中...' : '确认空投'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 空投矿机表单弹窗 */}
      {showMachineAirdropForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-4 mx-4 w-full max-w-sm">
            <div className="text-lg font-bold mb-4 text-center">空投矿机</div>
            
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">接收地址</div>
              <input
                type="text"
                placeholder="输入接收地址"
                value={machineAirdropAddress}
                onChange={(e) => setMachineAirdropAddress(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl text-sm"
              />
            </div>

            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">空投数量</div>
              <input
                type="number"
                placeholder="输入数量"
                value={machineAirdropCount}
                onChange={(e) => setMachineAirdropCount(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl text-sm"
              />
              <div className="text-xs text-gray-500 mt-1">
                最大数量: 100 个
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowMachineAirdropForm(false)}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl text-sm font-medium"
              >
                取消
              </button>
              <button
                onClick={handleMachineAirdrop}
                disabled={isMachineAirdropping || !machineAirdropAddress || !machineAirdropCount}
                className="flex-1 py-3 bg-[#895EFE] text-white rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isMachineAirdropping ? '空投中...' : '确认空投'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
