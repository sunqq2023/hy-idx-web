import { Checkbox, ProgressBar } from 'antd-mobile'
import classNames from 'classnames'
import styles from './Home.module.css'
import { selectedSvg, userMachineSvg, startedSvg, noOpenSvg } from '@/assets'
import { SHA256 } from 'crypto-js'
import { MachineInfo } from '@/constants/types'
import AdaptiveNumber, { NumberType } from '@/components/AdaptiveNumber'
import { formatEther } from 'viem'

const getPercent = (fuelRemainingMinutes: number) => {
  const minutesInDay = 24 * 60
  return (fuelRemainingMinutes / minutesInDay / 360) * 100
}

const getRemainingLife = (producedMix) => {
  return (360 * (1440 - getFormattedMix(producedMix))) / 1440
}

const getRemainingFuel = (fuelRemainingMinutes: number) => {
  const minutesInDay = 24 * 60
  const RemainingFuelToDay = fuelRemainingMinutes / minutesInDay
  return parseFloat(RemainingFuelToDay.toFixed(2))
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

const getFormattedMix = (producedMix) => {
  if (producedMix !== undefined && producedMix > 0) {
    const val = formatEther(BigInt(producedMix))
    return +val
  }
  return 0
}

const UserPageCheckableItem = ({
  item,
  onLeftClick,
  onRightClick
}: {
  item: MachineInfo
  onLeftClick: (e: MachineInfo) => void
  onRightClick: (e: MachineInfo) => void
}) => {
  const getFormattedMix = () => {
    if (item.producedMix !== undefined && item.producedMix > 0) {
      const val = formatEther(BigInt(item.producedMix))
      return +val
    }
    return 0
  }

  return (
    <div
      key={item.id}
      className="bg-white rounded-2xl p-2 flex justify-between  text-[.68rem]"
    >
      <div className="flex relative" onClick={() => onLeftClick(item)}>
        <Checkbox
          checked={item.checked}
          icon={(checked) =>
            checked ? (
              <img src={selectedSvg} alt="" />
            ) : (
              <div className="border border-[#a5a4a4] w-[1rem] h-[1rem] rounded-[50%]" />
            )
          }
        />

        <img src={userMachineSvg} alt="" className="mx-2 w-[3.625rem]" />
      </div>

      <div
        className="basis-5/7  h-full flex flex-col gap-0.5"
        onClick={() => onRightClick(item)}
      >
        <div className="flex justify-between mb-2">
          <div
            className={classNames(
              styles['machine-name'],
              'flex rounded-3xl pr-3 text-[.5rem] items-center'
            )}
          >
            <div className="font-bold">#{generateCode(item.id)}</div>
            <div className="text-white ml-3">矿机</div>
          </div>
          <div className="text-[#15b268] flex gap-1">
            <img
              src={
                item.isProducing && item.isActivatedStakedLP
                  ? startedSvg
                  : noOpenSvg
              }
              alt=""
              width={50}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <div>燃料费剩余：</div>
          <ProgressBar
            percent={getPercent(item.fuelRemainingMinutes)}
            className="flex-1"
            style={{
              '--fill-color': '#615371'
            }}
          />
          <div>{getRemainingFuel(item.fuelRemainingMinutes)}天</div>
        </div>

        <div className="flex gap-1">
          累计产出积分：
          <AdaptiveNumber
            type={NumberType.BALANCE}
            value={getFormattedMix()}
            decimalSubLen={2}
            className="font-bold"
          />
          MIX
        </div>

        <div className="flex gap-1">
          矿机生命剩余：
          <AdaptiveNumber
            type={NumberType.BALANCE}
            value={getRemainingLife(item.producedMix)}
            decimalSubLen={2}
            className="font-bold"
          />
          天
        </div>
      </div>
    </div>
  )
}
export default UserPageCheckableItem
