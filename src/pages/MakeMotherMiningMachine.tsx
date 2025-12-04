import { makemmmSvg, noSvg, percentSvg, rmbSvg } from '@/assets'
import { Button, Divider, Input, TextArea, Toast } from 'antd-mobile'
import { useCallback, useEffect, useState } from 'react'
import {
  writeContract,
  waitForTransactionReceipt,
  readContract,
  multicall
} from '@wagmi/core'
import config from '@/proviers/config'
import { useNavigate } from 'react-router-dom'
import {
  CHAIN_ID,
  MiningMachineSystemLogicABI,
  MiningMachineSystemLogicAddress,
  MiningMachineSystemStorageABI,
  MiningMachineSystemStorageAddress
} from '@/constants'
import { formatEther } from 'viem'
import { useAccount, useWriteContract } from 'wagmi'
import AdaptiveNumber, { NumberType } from '@/components/AdaptiveNumber'

const isEmptyString = (str: string) => {
  return !str || str.trim().length === 0
}

const MakeMotherMiningMachine = () => {
  const { address } = useAccount()
  const [count, setCount] = useState('')
  const [price, setPrice] = useState('')
  const [percent, setPercent] = useState('')
  const [distributorAddress, setDistributorAddress] = useState('')
  const [distributorName, setDistributorName] = useState('')

  const [activeAndGasFee, setActiveAndGasFee] = useState('')

  const [PLATFORM_FEE_USD, setPLATFORM_FEE_USD] = useState('')
  const [SELLER_INCOME_USD, setSELLER_INCOME_USD] = useState('')
  const [feeLoading, setFeeLoading] = useState(false)
  const { writeContractAsync } = useWriteContract()

  const queryActiveAndGasFee = async () => {
    try {
      const contracts = [
        {
          address: MiningMachineSystemLogicAddress,
          abi: MiningMachineSystemLogicABI,
          functionName: 'PLATFORM_FEE_USD',
          args: []
        },
        {
          address: MiningMachineSystemLogicAddress,
          abi: MiningMachineSystemLogicABI,
          functionName: 'SELLER_INCOME_USD',
          args: []
        }
      ]

      const res = await multicall(config, {
        contracts
      })

      setPLATFORM_FEE_USD(String(res[0].result))
      setSELLER_INCOME_USD(String(res[1].result))
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    queryActiveAndGasFee()
  }, [])

  const handleChangeActiveAndGasFee = async () => {
    if (PLATFORM_FEE_USD === '' || SELLER_INCOME_USD === '') {
      Toast.show({
        content: '正在读取链上数据，请稍后再尝试',
        position: 'center'
      })
      return
    }

    if (+activeAndGasFee === 0 || activeAndGasFee === '') {
      Toast.show({
        content: '燃料费、提现费不能为0',
        position: 'center'
      })
      return
    }
    try {
      setFeeLoading(true)
      const hash = await writeContractAsync({
        address: MiningMachineSystemLogicAddress,
        abi: MiningMachineSystemLogicABI,
        functionName: 'setChildMachineTradeConfig',
        args: [PLATFORM_FEE_USD, SELLER_INCOME_USD, activeAndGasFee]
      })

      await waitForTransactionReceipt(config, {
        hash
      })
      Toast.show({
        content: '修改成功!',
        position: 'center'
      })
      setFeeLoading(false)
      setActiveAndGasFee('')
    } catch (error) {
      Toast.show({
        content: '修改失败',
        position: 'center'
      })
      setFeeLoading(false)
      console.error(error)
    }
  }

  const [isMaking, setIsMaking] = useState(false)
  const navigate = useNavigate()

  const [usdtToIdxRate, setUsdtToIdxRate] = useState('0')

  const handleMake = async () => {
    // navigate('/sale-person')
    // return

    if (
      isEmptyString(count) ||
      isEmptyString(price) ||
      isEmptyString(percent) ||
      isEmptyString(distributorName) ||
      isEmptyString(distributorName) ||
      isEmptyString(distributorAddress)
    ) {
      Toast.show({
        content: '请填充完整表单',
        position: 'center',
        duration: 1000
      })
      return
    }

    try {
      Toast.show({
        content: '制作中...',
        position: 'center',
        duration: 0
      })

      setIsMaking(true)

      const args = [
        +count,
        +price,
        +percent,
        distributorName,
        distributorAddress
      ]

      // storage
      const hash = await writeContract(config, {
        address: MiningMachineSystemLogicAddress,
        abi: MiningMachineSystemLogicABI,
        functionName: 'batchMintMotherMachine',
        args
      })

      await waitForTransactionReceipt(config, {
        hash,
        chainId: CHAIN_ID
      })

      Toast.clear()
    } catch (error) {
      Toast.show({
        content: '制作失败',
        position: 'center',
        duration: 2000
      })
      console.error(error)
    } finally {
      setIsMaking(false)
    }
  }

  const handleQueryHistory = () => {
    if (isMaking) {
      return
    }
    navigate('/make-mmm/history')
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

  // const getIsSalePerson = useCallback(async () => {
  //   try {
  //     const result = await readContract(config, {
  //       address: MiningMachineSystemStorageAddress,
  //       abi: MiningMachineSystemStorageABI,
  //       functionName: 'isMotherMachineDistributor',
  //       args: [address]
  //     })
  //     console.log('test', result)
  //   } catch (error) {
  //     console.log(error)
  //   }
  // }, [address])

  // useEffect(() => {
  //   getIsSalePerson()
  // }, [getIsSalePerson])

  return (
    <div className="pt-4 pb-6 px-[21px]">
      <span className="ml-4">制作母矿机</span>

      <div className="container-wrap mt-3">
        <Item
          src={noSvg}
          text="母矿机制作数量"
          inputText="输入数量"
          unit="台"
          value={count}
          max={100}
          setValue={setCount}
        />
        <Item
          value={price}
          setValue={setPrice}
          src={rmbSvg}
          text="渠道销售单价"
          inputText="输入单价"
          unit="USDT/台"
          slot={
            <div className="flex justify-end mt-1 gap-2">
              <span className="font-bold">1</span>
              <span className="">USDT =</span>
              <AdaptiveNumber
                type={NumberType.BALANCE}
                value={usdtToIdxRate}
                decimalSubLen={2}
                className="font-bold"
              />
              IDX
            </div>
          }
          max={1000}
        />
        <Item
          value={percent}
          setValue={setPercent}
          src={percentSvg}
          text="销售员提成比例"
          inputText="输入比例"
          unit="%"
          max={100}
        />

        <div className="mb-2">
          <div className="flex items-center mb-2">
            <div className="bg-black rounded-[50%] w-[.3125rem] h-[.3125rem] mr-2"></div>
            <div>分销商钱包地址</div>
          </div>
          <TextArea
            onChange={(val) => setDistributorAddress(val)}
            value={distributorAddress}
            placeholder="输入钱包地址..."
            rows={2}
            className="bg-[#ececee] rounded-3xl p-5 "
          />
        </div>
        <Divider className="mt-4  w-full h-0.5 bg-[#ececee]" />

        <div className="mb-8">
          <div className="flex items-center mb-2">
            <div className="bg-black rounded-[50%] w-[.3125rem] h-[.3125rem] mr-2"></div>
            <div>分销商备注名</div>
          </div>
          <Input
            onChange={(val) => setDistributorName(val)}
            value={distributorName}
            placeholder="输入备注名..."
            className="!bg-[#ececee] rounded-3xl px-5 py-1"
          />
        </div>

        <Button
          onClick={handleMake}
          className="!bg-black !rounded-3xl !text-white flex justify-center !py-1 w-full !text-[13px]"
          loading={isMaking}
        >
          制作母矿机
        </Button>
      </div>

      <div className="container-wrap mt-3">
        <img
          src={makemmmSvg}
          alt=""
          className="ml-8"
          onClick={handleQueryHistory}
        />
      </div>

      <div className="bg-white p-3 rounded-2xl mt-2 flex flex-col gap-1">
        <h2 className="mb-2 font-bold">费用设置</h2>
        <Input
          placeholder="燃烧费、激活费"
          style={{
            '--font-size': '13px'
          }}
          className="!bg-[#f3f3f3] rounded-3xl px-4 py-2 !flex !items-center !justify-center mb-2"
          value={activeAndGasFee}
          type="number"
          onChange={(val) => setActiveAndGasFee(val)}
        />
        <Button
          className="!bg-black !text-white !rounded-3xl !ml-auto !mt-2  !py-1 !w-full"
          style={{
            fontSize: '13px'
          }}
          loading={feeLoading}
          onClick={() => handleChangeActiveAndGasFee()}
        >
          修改
        </Button>
      </div>
    </div>
  )
}

const Item = ({
  value,
  setValue,
  src,
  text,
  inputText,
  unit,
  slot,
  max
}: {
  value: string | undefined
  setValue: React.Dispatch<React.SetStateAction<string>>
  src: string
  text: string
  inputText: string
  unit: string
  slot?: React.ReactNode
  max: number
}) => {
  const handleChange = (val: string) => {
    if (+val <= max) {
      setValue(val)
    }
  }
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <img className="mr-1.5" src={src} alt="" />
          <div>{text}</div>
        </div>
        <div className="relative">
          <Input
            onChange={handleChange}
            value={value}
            placeholder={inputText}
            type="number"
            max={max}
            className="!bg-[#ececee] px-5 py-1.5 text-[#aba8b1] rounded-3xl !text-[15px] !max-w-[11rem]"
          />
          <div className="pointer-none absolute right-5 top-[50%] translate-y-[-50%] text-[#292929] text-[13px]">
            {unit}
          </div>
        </div>
      </div>

      {slot}
      <Divider className="mt-4  w-full h-0.5 bg-[#ececee]" />
    </div>
  )
}

export default MakeMotherMiningMachine
