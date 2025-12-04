import { arrowSvg, calculatorSvg } from '@/assets'
import AdaptiveNumber, { NumberType } from '@/components/AdaptiveNumber'
import config from '@/proviers/config'
import { Button, Input, Toast } from 'antd-mobile'
import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  readContract,
  writeContract,
  waitForTransactionReceipt
} from '@wagmi/core'
import {
  CHAIN_ID,
  MiningMachineProductionLogicABI,
  MiningMachineProductionLogicAddress,
  MiningMachineSystemStorageABI,
  MiningMachineSystemStorageAddress
} from '@/constants'
import { useAccount } from 'wagmi'
import { formatEther } from 'viem'

const SyntheticMachine = () => {
  const [isSyntheticLoading, setIsSyntheticLoading] = useState(false)
  const navigate = useNavigate()
  const [count, setCount] = useState('')
  const { address } = useAccount()

  const [mixBalance, setMixBalance] = useState('')
  const handleChangeCount = (val: string) => {
    setCount(val)
  }
  const handlBack = () => {
    navigate('/user')
  }

  const handleMax = () => {
    const maxVal = Math.floor(+mixBalance / 80)

    if (maxVal > 10) {
      setCount('10')
    } else if (maxVal === 0) {
      setCount('')
    } else {
      setCount(String(maxVal))
    }
  }

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

  const handleSyntheticMachine = async () => {
    if (+count === 0 || count === '') {
      Toast.show({
        content: '至少合成1台矿机',
        position: 'center'
      })
      return
    }
    try {
      setIsSyntheticLoading(true)
      const hash = await writeContract(config, {
        address: MiningMachineProductionLogicAddress,
        abi: MiningMachineProductionLogicABI,
        functionName: 'mixToChildMachine',
        args: [count]
      })

      await waitForTransactionReceipt(config, {
        hash,
        chainId: CHAIN_ID
      })
      Toast.show({
        content: '合成成功',
        position: 'center'
      })
      queryMIXBalance()
      setCount('')
    } catch (error) {
      Toast.show({
        content: '合成失败',
        position: 'center'
      })
      console.error(error)
    } finally {
      setIsSyntheticLoading(false)
    }
  }

  const isDisabled = () => {
    if (count !== '' && count !== '0') {
      if (+count > 10) {
        return true
      }
      if (+mixBalance < 80 * +count) {
        return true
      }
    }
  }

  const getButtonText = () => {
    if (count !== '' && count !== '0') {
      if (+count > 10) {
        return '每次最多10台'
      }
      if (+mixBalance < 80 * +count) {
        return '余额不足'
      }
    }
    return '合成'
  }
  return (
    <div className="px-[21px]">
      <div className="flex pt-4">
        <Button
          onClick={handlBack}
          className="!p-[0] !rounded-2xl"
          loading={isSyntheticLoading}
        >
          <img src={arrowSvg} alt="" />
        </Button>
        <span className="m-auto text-[17px] font-bold text-black">
          合成矿机
        </span>
      </div>

      <div className="bg-black rounded-t-2xl text-white p-[21px] mt-6">
        <div>我的MIX积分</div>

        <div className="text-center mt-6">
          <AdaptiveNumber
            type={NumberType.BALANCE}
            value={mixBalance}
            decimalSubLen={2}
            className="font-bold text-[26px] mr-2"
          />
          MIX
        </div>
      </div>
      <div className="bg-white rounded-b-2xl flex justify-center items-center py-6 gap-[40px]">
        <div className="rounded-[12px] p-2.5 border border-[#bebebe]">
          <img src={calculatorSvg} alt="" className="w-[.9375rem]" />
        </div>

        <div className="text-[.875rem]">80MIX积分 = 1台矿机</div>
      </div>

      <div className="bg-white p-[21px] rounded-2xl mt-6">
        <div className="text-[14px] font-bold mb-4">
          合成矿机数量<span>（每次至多10个）</span>
        </div>

        <div className="items-center">
          <div className="relative">
            <Input
              placeholder="输入整数"
              className="!bg-[#f3f3f3] rounded-3xl px-4 py-1.5"
              value={count}
              type="number"
              onChange={handleChangeCount}
              style={{
                '--font-size': '14px'
              }}
            />
            <span
              onClick={handleMax}
              className="absolute right-[2.5rem] top-[.5625rem] text-[8px] bg-[#895eff] text-white px-2 py-0.5 rounded-3xl"
            >
              MAX
            </span>
            <span className="absolute right-[1.25rem] top-[.4375rem] text-[.875rem]">
              台
            </span>
          </div>
        </div>

        <div className="text-end mt-4 text-[.75rem]">
          余额：
          <AdaptiveNumber
            type={NumberType.BALANCE}
            value={mixBalance}
            decimalSubLen={2}
            className="font-bold text-[1rem] mr-2"
          />
          MIX积分
        </div>

        <div className="mt-8">
          <Button
            onClick={handleSyntheticMachine}
            loading={isSyntheticLoading}
            className="!bg-black !text-white !rounded-3xl !ml-auto !py-2 !w-full "
            disabled={isDisabled()}
            style={{
              fontSize: '14px'
            }}
          >
            {getButtonText()}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SyntheticMachine
