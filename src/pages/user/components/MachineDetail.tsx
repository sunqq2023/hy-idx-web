import {
  arrowSvg,
  purpleMiningMachineSvg,
  startedSvg,
  toBeActiveSvg,
  wreckageSvg,
  noOpenSvg,
  userMachineSvg
} from '@/assets'
import { Button, Dialog, Divider, ProgressBar, Toast } from 'antd-mobile'
import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MachineInfo } from '@/constants/types'
import { formatTime } from '@/utils/helper'
import AdaptiveNumber, { NumberType } from '@/components/AdaptiveNumber'
import { useAccount, useReadContract } from 'wagmi'
import { generateCode } from '../../../components/CheckableItem';

import {
  readContract,
  writeContract,
  waitForTransactionReceipt
} from '@wagmi/core'
import config from '@/proviers/config'
import {
  CHAIN_ID,
  IDX_CONTRACTS_ADDRESS,
  MiningMachineSystemLogicABI,
  MiningMachineSystemLogicAddress,
  MiningMachineSystemStorageABI,
  MiningMachineSystemStorageAddress
} from '@/constants'
import usePopup from '@/components/usePopup'
import { erc20Abi, formatEther } from 'viem'
import dayjs from 'dayjs'

const MachineDetail = () => {
  const navigate = useNavigate()
  const { isConnected, address: userAddress } = useAccount()
  const [isMotherMachineDistributor, setIsMotherMachineDistributor] =
    useState(false)
  const location = useLocation()

  // 确保 pageData 初始化为空对象，避免 undefined 错误
  const pageData = location.state as MachineInfo || { id: 0 }
  console.log('machine detail', pageData)

  const handlBack = () => {
    navigate(-1, { state: { fromMachineDetail: true } })
  }

  const [needToPayIdxAmount, setneedToPayIdxAmount] = useState(0)
  const [idxBalance, setidxBalance] = useState(0)

  const {
    data: idxPrice,
    isLoading: idxPriceLoading,
    error: idxPriceError
  } = useReadContract({
    address: MiningMachineSystemLogicAddress,
    abi: MiningMachineSystemLogicABI,
    functionName: 'getIDXAmount',
    args: [30]
  })

  const {
    data: idxData,
    isLoading: idxBalanceLoading,
    error: idxBalanceError
  } = useReadContract({
    address: IDX_CONTRACTS_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [userAddress!]
  })

  useEffect(() => {
    if (!idxBalanceLoading) {
      setidxBalance(Number(idxData ? formatEther(idxData) : '0'))
    }
  }, [idxBalanceLoading, idxData])

  useEffect(() => {
    if (!idxPriceLoading) {
      setneedToPayIdxAmount(Number(idxPrice ? formatEther(idxPrice) : '0'))
    }
  }, [idxPriceLoading, idxPrice])

  const handleShutdown = () => {
    // 显示确认对话框
    Dialog.confirm({
      content: '是否关停矿机',
      onConfirm: async () => { // 用户确认后执行的逻辑
        try {
          // 调用合约的关停方法
          const hash = await writeContract(config, {
            address: MiningMachineSystemLogicAddress, // 合约地址
            abi: MiningMachineSystemLogicABI,         // 合约ABI
            functionName: 'deactivateLP',             // 关停对应的合约函数
            args: [pageData.id]                       // 传入当前矿机ID作为参数
          })

          // 等待交易上链确认
          const receipt = await waitForTransactionReceipt(config, {
            hash,
            chainId: CHAIN_ID
          })

          // 确保交易成功
          if (receipt.status === 'success') {
            // 操作成功后的反馈
            Toast.show({
              content: '关停成功',
              position: 'center'
            })
            // 返回主页面并携带刷新信号
            navigate('/user', { 
              state: { needRefresh: true },
              replace: true  // 替换历史记录，避免回退问题
            })
          } else {
            throw new Error('交易未成功确认')
          }
        } catch (error) {
          // 操作失败后的反馈
          Toast.show({
            content: '关停失败',
            position: 'center'
          })
          console.error(error)
        }
      }
    })
  }

  const [isPaying, setIsPaying] = useState(false)
  const handlePay = async () => {
    setIsPaying(true);

    // 参数校验：确保矿机ID有效
    if (typeof pageData.id !== 'number' || pageData.id <= 0) {
      Toast.show({ 
        content: '矿机ID无效', 
        position: 'center', 
        duration: 2000 
      });
      setIsPaying(false);
      return;
    }

    try {
      const hash = await writeContract(config, {
        address: MiningMachineSystemLogicAddress as `0x${string}`,
        abi: MiningMachineSystemLogicABI,
        functionName: 'batchActivateMachinesWithLP',
        args: [[pageData.id]]
      });

      const receipt = await waitForTransactionReceipt(config, { hash });
      
      if (receipt.status === 'success') {
        Toast.show({ 
          content: '激活成功!', 
          position: 'center', 
          duration: 2000 
        });
        setOpen(false);
        // 激活成功后返回主页面并刷新
        navigate('/user', { 
          state: { needRefresh: true },
          replace: true 
        });
      } else {
        throw new Error('交易未成功确认')
      }
    } catch (error) {
      Toast.show({
        content: `激活失败: ${error instanceof Error ? error.message : '未知错误'}`,
        position: 'center',
        duration: 3000
      });
      console.error('激活失败详情:', error);
    } finally {
      setIsPaying(false);
    }
  };

  const { setOpen, component } = usePopup({
    title: '',
    contentClassName: '',
    closeButtonClassName: '',
    content: (
      <div className="w-full">
        <div className="text-[#6433EC] font-bold text-[15px] pt-2 pb-4">
          激活矿机需支付打底池费用!
        </div>

        <div>
          <div className="flex justify-between">
            <div className="font-bold text-[14px]">待支付IDX</div>
            <div className="text-[#FF5050] font-bold text-[16px]">
              <AdaptiveNumber
                type={NumberType.BALANCE}
                value={+needToPayIdxAmount}
                decimalSubLen={2}
                className="ml-2 mr-1.5"
              />
            </div>
          </div>
          <div className="flex justify-end text-[12px]">
            <div className="text-[#686D6D]">钱包余额：</div>
            <div className="font-bold">
              <AdaptiveNumber
                type={NumberType.BALANCE}
                value={idxBalance}
                decimalSubLen={2}
                className="ml-2 mr-1.5"
              />
            </div>
          </div>
        </div>

        <Divider />

        <Button
          onClick={handlePay}
          className="!bg-black !rounded-3xl !text-white flex justify-center !py-10 w-full !text-[16px]"
          loading={isPaying}
          disabled={idxBalance < needToPayIdxAmount}
        >
          {idxBalance > needToPayIdxAmount ? '支付费用' : '余额不足'}
        </Button>
      </div>
    )
  })
  
  const handleActivate = () => {
    setOpen(true)
  }

  const getFormattedMix = (producedMix: any) => {
    if (producedMix !== undefined && producedMix > 0) {
      const val = formatEther(BigInt(producedMix))
      return +val
    }
    return 0
  }

  const getRemainingLife = () => {
    if (pageData.mtype === 1) {
      if (pageData.isActivatedStakedLP) {
        const now = new Date().getTime() / 1000
        const daysDiff = dayjs(now).diff(dayjs(pageData.activatedAt), 'day')
        return 90 - daysDiff
      }
      return 90
    }

    return Math.floor(
      (360 * (1440 - getFormattedMix(pageData.producedMix))) / 1440
    )
  }

  const getRemainingLifePercent = () => {
    if (pageData.mtype === 1) {
      if (pageData.isActivatedStakedLP) {
        const now = new Date().getTime() / 1000
        const daysDiff = dayjs(now).diff(dayjs(pageData.activatedAt), 'day')
        return ((90 - daysDiff) / 90) * 100
      }
      return 0
    }

    const producedHoursToDay =
      (360 * (1440 - getFormattedMix(pageData.producedMix))) / 1440
    return (producedHoursToDay / 360) * 100
  }

  const getRemainingFuel = (fuelRemainingMinutes: number) => {
    if (pageData.mtype === 2) {
      const minutesInDay = 24 * 60
      const RemainingFuelToDay = fuelRemainingMinutes / minutesInDay
      return parseFloat(RemainingFuelToDay.toFixed(2))
    }
    return 0
  }

  const getRemainingFuelPercent = (fuelRemainingMinutes: number) => {
    if (pageData.mtype === 2) {
      const minutesInDay = 24 * 60
      return (fuelRemainingMinutes / minutesInDay / 360) * 100
    }
    return 0
  }

  const isActivate = () => {
    return pageData.isActivatedStakedLP
  }

  const getIsMotherMachineDistributor = useCallback(async () => {
    if (isConnected) {
      try {
        const result = await readContract(config, {
          address: MiningMachineSystemStorageAddress,
          abi: MiningMachineSystemStorageABI,
          functionName: 'isMotherMachineDistributor',
          args: [userAddress]
        })
        setIsMotherMachineDistributor(result)
      } catch (error) {
        console.log(error)
      }
    }
  }, [userAddress, isConnected])

  useEffect(() => {
    getIsMotherMachineDistributor()
  }, [getIsMotherMachineDistributor])

  const getImage = () => {
    if (pageData.isActivatedStakedLP && pageData.isProducing) {
      return startedSvg
    } else if (pageData.destroyed) {
      return wreckageSvg
    } else if (
      pageData.isActivatedStakedLP &&
      !pageData.isProducing &&
      pageData.mtype === 1
    ) {
      return startedSvg
    } else if (
      pageData.isActivatedStakedLP &&
      !pageData.isProducing &&
      pageData.mtype === 2
    ) {
      return noOpenSvg
    } else if (!pageData.isActivatedStakedLP) {
      return toBeActiveSvg
    }
    return toBeActiveSvg // 默认返回未激活图标
  }

  return (
    <div className="h-full overflow-scroll px-[21px]">
      {component}
      <div className="flex pt-4">
        <img src={arrowSvg} alt="返回" onClick={handlBack} />
        <span className="m-auto text-[17px] font-bold">矿机详情</span>
      </div>

      <div className="transfer-container mt-4 relative">
        <img
          src={getImage()}
          alt="矿机状态"
          width={50}
          className="absolute right-[15px]"
        />
        <div className="flex gap-2">
          <img
            src={pageData.mtype === 1 ? purpleMiningMachineSvg : userMachineSvg}
            alt="矿机图标"
            width={50}
          />

          <div className="flex flex-col gap-1 text-[.68rem]">
            <div className="flex gap-3">
              <div className="text-[#666666]">矿机编号：</div>
              <div className="font-bold text-gray-800">
                {typeof pageData.id === 'number' && pageData.id > 0
                  ? `#${generateCode(pageData.id)}`
                  : '加载中...'
                }
              </div>
            </div>

            <div className="flex gap-3">
              <div className="text-[#666666]">矿机类型：</div>
              <div className="font-bold text-[#BB7054]">
                {pageData.mtype === 1 ? '母矿机' : '子矿机'}
              </div>
            </div>

            <div className="flex gap-3">
              <div className="text-[#666666]">激活日期：</div>
              <div className="font-bold">
                {isActivate() ? formatTime(pageData.activatedAt) : '未激活'}
              </div>
            </div>
          </div>
        </div>

        <Divider />

        <div className="px-[20px] flex flex-col gap-2">
          {pageData.mtype === 2 && (
            <div className="flex text-[12px]">
              <div className="w-[100px] text-[#666666]">燃料费剩余：</div>
              <ProgressBar
                percent={getRemainingFuelPercent(
                  pageData.fuelRemainingMinutes ?? 0
                )}
                className="w-[45%]"
                style={{
                  '--fill-color': '#615371'
                }}
              />
              <div className="ml-2 font-bold">
                {getRemainingFuel(pageData.fuelRemainingMinutes ?? 0)}天
              </div>
            </div>
          )}

          <div className="flex text-[12px]">
            <div className="w-[100px] text-[#666666]">生命剩余：</div>
            <ProgressBar
              percent={getRemainingLifePercent()}
              className="w-[45%]"
              style={{
                '--fill-color': '#615371'
              }}
            />
            <div className="ml-2 font-bold">{getRemainingLife()}天</div>
          </div>

          {pageData.mtype === 2 && (
            <div className="flex text-[12px]">
              <div className="w-[100px] text-[#666666]">累计产出积分：</div>
              <div className=" font-bold text-[#4F4E4F]">
                <AdaptiveNumber
                  type={NumberType.BALANCE}
                  value={+formatEther(BigInt(pageData.producedMix ?? 0))}
                  decimalSubLen={2}
                  className="ml-2 mr-1.5"
                />
                MIX
              </div>
            </div>
          )}
        </div>

        {pageData.isActivatedStakedLP && (
          <div className="mt-2 text-sm text-gray-600">
            注：请谨慎执行本操作，矿机将立即停止运行，并将底池费用退还到你的钱包，
            所有燃料费将清零，矿机状态回退到"未激活"状态；
          </div>
        )}

        {isActivate() ? (
          <Button
            className="!mt-4 w-full !rounded-2xl !border-[#d6d6d6]"
            onClick={handleShutdown}
            style={{
              fontSize: '14px'
            }}
          >
            关停矿机
          </Button>
        ) : (
          !isMotherMachineDistributor && (
            <Button
              className="!mt-4 w-full !rounded-2xl !border-[#d6d6d6] !bg-black !text-white"
              onClick={handleActivate}
              style={{
                fontSize: '14px'
              }}
            >
              激活矿机
            </Button>
          )
        )}
      </div>

      <div className="transfer-container mt-4 ">
        <div className="flex gap-4">
          <div className="text-lg font-bold text-gray-800 text-[14px]">
            矿机权益
          </div>
          <div className="text-[#666666] flex items-center text-[12px]">
            注：激活后才能获得权益
          </div>
        </div>

        <Divider className="!my-3" />

        <div className="flex text-[#666] text-[12px]">
          <div className="w-[90px]">矿机类型</div>
          <div className="flex-1">权益</div>
        </div>
        <Divider className="!my-3" />

        <div className="flex text-[12px]">
          <div className="w-[90px] font-bold ">母矿机</div>
          <div className="flex-1">
            母矿机每10天产出1个矿机，母矿机不能产出MIX积分；
          </div>
        </div>
        <Divider className="!my-3" />

        <div className="flex text-[12px]">
          <div className="w-[90px] font-bold ">矿机</div>
          <div className="flex-1">
            每1台矿机每日产出4个MIX积分，每日00:00:00~01:00:00内到账
          </div>
        </div>
      </div>
    </div>
  )
}

export default MachineDetail
