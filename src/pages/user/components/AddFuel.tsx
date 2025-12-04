import { arrowSvg } from '@/assets'
import { Button, Divider, Toast } from 'antd-mobile'
import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { readContract } from '@wagmi/core'
import config from '@/proviers/config'
import {
  ALLOWANCE_QUOTA,
  IDX_CONTRACTS_ADDRESS,
  MiningMachineSystemLogicABI,
  MiningMachineSystemLogicAddress
} from '@/constants'
import AdaptiveNumber, { NumberType } from '@/components/AdaptiveNumber'
import { erc20Abi, formatEther, parseEther, parseGwei } from 'viem'
import { useAccount, useWriteContract } from 'wagmi'
import { useSequentialContractWrite } from '@/hooks/useSequentialContractWrite'
import { usePaymentCheck } from '@/hooks/usePaymentCheck'

const AddFuel = () => {
  const { address: userAddress } = useAccount()
  const navigate = useNavigate()
  const location = useLocation()

  const pageData = location.state

  const [isPaying, setIsPaying] = useState(false)
  const [idxBalance, setIdxBalance] = useState('')
  const [idxPrice, setIdxPrice] = useState(0)

  const [monthCount, setMonthCount] = useState(1)

  const { executeSequentialCalls, batchPayFuel } = useSequentialContractWrite()
  const { writeContractAsync } = useWriteContract()
  const [maskCount, setMaskCount] = useState(1) // 批量操作只有1笔交易
  const handlBack = () => {
    navigate('/user')
  }

  const handleQueryIdxBalance = useCallback(async () => {
    try {
      console.log('=== 查询IDX余额 ===')
      console.log('合约地址:', IDX_CONTRACTS_ADDRESS)
      console.log('合约ABI:', erc20Abi)
      console.log('函数名: balanceOf')
      console.log('查询地址:', userAddress)
      
      const balance = await readContract(config, {
        address: IDX_CONTRACTS_ADDRESS,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [userAddress!]
      })
      
      console.log('原始余额数据:', balance)
      console.log('格式化后余额:', formatEther(balance))
      setIdxBalance(formatEther(balance))
    } catch (error) {
      console.error('查询IDX余额失败:', error)
    }
  }, [userAddress])

  useEffect(() => {
    handleQueryIdxBalance()
  }, [handleQueryIdxBalance])

  const handleQueryIdxPrice = async () => {
    try {
      console.log('=== 查询IDX价格 ===')
      console.log('合约地址:', MiningMachineSystemLogicAddress)
      console.log('合约ABI:', MiningMachineSystemLogicABI)
      console.log('函数名: getIDXAmount')
      console.log('参数: [15] (15 USDT)')
      
      const price = await readContract(config, {
        address: MiningMachineSystemLogicAddress,
        abi: MiningMachineSystemLogicABI,
        functionName: 'getIDXAmount',
        args: [15]
      })
      
      console.log('原始价格数据:', price)
      console.log('格式化后价格:', price ? formatEther(price as bigint) : '0')
      setIdxPrice(+(price ? formatEther(price as bigint) : '0'))
    } catch (error) {
      console.error('查询IDX价格失败:', error)
    }
  }

  useEffect(() => {
    handleQueryIdxPrice()
  }, [])

  const {
    isLoading: isPaymentCheckLoading,
    isAllowanceSufficient,
    isBalanceSufficient
  } = usePaymentCheck(
    parseEther(String(Math.ceil(idxPrice * monthCount * pageData.length)))
  )

  const handlePay = async () => {
    try {
      console.log('=== 开始加注燃料流程 ===')
      console.log('当前用户地址:', userAddress)
      console.log('选中的矿机数据:', pageData)
      console.log('购买月数:', monthCount)
      console.log('IDX价格:', idxPrice)
      console.log('总费用计算:', idxPrice * monthCount * pageData.length)
      
      if (isPaymentCheckLoading) return

      if (!isBalanceSufficient) {
        console.log('余额不足，无法继续')
        Toast.show({
          content: '余额不足',
          position: 'center',
          duration: 2000
        })
        return
      }

      setIsPaying(true)
      
      // 授权检查
      console.log('=== 检查IDX授权 ===')
      console.log('授权状态:', isAllowanceSufficient ? '已授权' : '未授权')
      
      if (!isAllowanceSufficient) {
        console.log('=== 执行IDX智能授权检查 ===')
        
        // 计算实际需要的金额
        const actualAmount = parseEther(String(Math.ceil(idxPrice * monthCount * pageData.length)))
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
          console.log('授权合约地址:', IDX_CONTRACTS_ADDRESS)
          console.log('授权目标地址:', MiningMachineSystemLogicAddress)
          
          // 尝试自动Gas估算，失败时使用回退方案
          try {
            console.log('尝试自动Gas估算...')
            await writeContractAsync({
              address: IDX_CONTRACTS_ADDRESS,
              abi: erc20Abi,
              functionName: 'approve',
              args: [MiningMachineSystemLogicAddress, smartAllowance]
            })
          } catch (error) {
            // 如果是Gas估算失败，使用回退方案
            if (error.message.includes('gasLimit') || error.message.includes('null')) {
              console.warn('Gas估算失败，使用回退方案:', error.message)
              await writeContractAsync({
                address: IDX_CONTRACTS_ADDRESS,
                abi: erc20Abi,
                functionName: 'approve',
                args: [MiningMachineSystemLogicAddress, smartAllowance],
                gas: 120000n,
                maxFeePerGas: parseGwei('25'),
                maxPriorityFeePerGas: parseGwei('3')
              })
            } else {
              throw error
            }
          }
          console.log('IDX智能授权交易已发送')
        }
      }

      // 构建批量加注燃料合约调用
      console.log('=== 构建批量加注燃料合约调用 ===')
      const machineIds = pageData.map((item: any) => BigInt(item.id))
      const monthCountBigInt = BigInt(monthCount)
      
      console.log('批量加注燃料参数:', {
        矿机ID列表: machineIds,
        购买月数: monthCountBigInt,
        合约地址: MiningMachineSystemLogicAddress,
        函数名: 'batchPayFuel'
      })

      console.log('=== 执行批量加注燃料 ===')
      const res = await batchPayFuel(
        MiningMachineSystemLogicAddress as `0x${string}`,
        machineIds,
        monthCountBigInt
      )
      
      if (res.success) {
        console.log('批量加注燃料成功，交易哈希:', res.txHash)
        setMaskCount(0) // 批量操作完成后，待处理数量设为0
        Toast.show({
          content: `成功为 ${pageData.length} 台矿机添加燃料费`,
          position: 'center',
          duration: 2000
        })
      } else {
        console.error('批量加注燃料失败:', res.error)
        throw new Error(res.error as string || '批量加注燃料失败')
      }
      
      navigate('/user')
    } catch (error) {
      console.error('=== 加注燃料流程异常 ===', error)
      Toast.show({
        content: '支付失败',
        position: 'center',
        duration: 2000
      })

      console.error(error)
      setIsPaying(false)
    }
  }

  const handleDecrease = () => {
    setMonthCount((mount) => {
      if (mount === 1) return mount
      return mount - 1
    })
  }

  const handleIncrease = () => {
    setMonthCount((mount) => mount + 1)
  }

  return (
    <div className="h-full overflow-scroll pb-[4rem]">
      <div className="px-[21px] text-center ">
        <div className=" bg-[#1d1c25] rounded-xl text-white py-1">
          你有
          <span className="text-[red] text-[1rem] font-bold mx-1">
            {maskCount}
          </span>
          笔批量交易待处理
        </div>
      </div>

      <div className="h-full overflow-scroll px-[21px] text-[.8125rem] relative">
        <div className="flex pt-4">
          <Button
            onClick={handlBack}
            className="!p-[0] !rounded-2xl"
            loading={isPaying}
          >
            <img src={arrowSvg} alt="" />
          </Button>
          <span className="m-auto text-[17px] font-bold text-black">
            添加燃料
          </span>
        </div>

        <div className="transfer-container mt-2">
          <div className="flex gap-2 items-center">
            钱包IDX余额
            <AdaptiveNumber
              type={NumberType.BALANCE}
              value={idxBalance}
              decimalSubLen={2}
              className="ml-auto mr-1.5 text-[1rem] font-bold"
            />
            <div>IDX</div>
          </div>

          <Divider className="!my-3" />

          <div className="flex">
            购买月数（月）
            <div className="flex ml-auto text-white gap-8">
              <div
                className="w-[22px] h-[22px] bg-[#c2c0cd] text-center rounded-[50%]"
                onClick={handleDecrease}
              >
                -
              </div>
              <div className="text-black text-[18px] font-bold">
                {monthCount}
              </div>
              <div
                className="w-[22px] h-[22px] bg-[#504379] text-center rounded-[50%]"
                onClick={handleIncrease}
              >
                +
              </div>
            </div>
          </div>
        </div>

        <div className="transfer-container mt-2">
          <div className="text-[.9375rem] font-bold mb-2 text-black">
            已选矿机
          </div>

          <Divider className="!mt-[10px] !mb-[0]" />

          <div className="flex  py-2 text-[#777777] text-[.75rem]">
            <div className="w-[90px]">矿机类型</div>
            <div className="flex-1 flex justify-between">
              <div className="pl-[15px]">燃料费单价</div>
              <div>已选数量</div>
            </div>
          </div>

          <Divider className="!mt-[10px] !mb-[0]" />

          <div className="flex text-[.75rem] pt-2">
            <div className="w-[90px] font-bold pl-[10px] ">矿机</div>
            <div className="flex-1 mx-auto ">15U 等值IDX/月</div>
            <div className="w-[3.125rem] text-center">{pageData.length}</div>
          </div>
          <Divider className="!my-2" />

          <div className="flex text-[.75rem]">
            <div className="w-[90px] font-bold pl-[10px]">母矿机</div>
            <div className="flex-1">无需添加燃料费</div>
            <div className="w-[3.125rem] text-center">/</div>
          </div>
        </div>

        <div className="transfer-container mt-2">
          <div className="flex gap-4">
            <div className="text-lg font-bold text-gray-800 text-[.9375rem]">
              燃料费权益
            </div>
            <div className="text-[#666666] flex items-center text-[12px]">
              注：激活后才能获得权益
            </div>
          </div>

          <Divider />

          <div className="flex text-[#666] text-[12px]">
            <div className="w-[90px]">矿机类型</div>
            <div className="flex-1 text-center">权益</div>
          </div>
          <Divider />

          <div className="flex text-[12px]">
            <div className="w-[90px] font-bold pl-[10px]">矿机</div>
            <div className="flex-1">
              每台矿机每日产出4个MIX积分，每日00:00:00~01:00:00内到账
            </div>
          </div>
          <Divider />

          <div className="flex text-[12px]">
            <div className="w-[90px] font-bold pl-[10px]">母矿机</div>
            <div className="flex-1">
              母矿机每10天产出1台矿机，母矿机不能产出MIX积分；
            </div>
          </div>
        </div>
      </div>

      <div className="w-full bg-white h-[3.8rem] flex items-center absolute bottom-0 px-[30px] justify-between">
        <div>
          <div className="text-[.75rem]">待支付 IDX</div>
          <div className="text-[#FF6D6D] text-[1.25rem]">
            <AdaptiveNumber
              type={NumberType.BALANCE}
              value={idxPrice * monthCount * pageData.length}
              decimalSubLen={2}
              className="font-bold"
            />
          </div>
        </div>

        <Button
          className="!bg-black !text-white !rounded-3xl !ml-auto   !h-[40px] !w-[100px]"
          style={{
            fontSize: '15px'
          }}
          onClick={handlePay}
          disabled={isPaying}
        >
          支付
        </Button>
      </div>
    </div>
  )
}

export default AddFuel
