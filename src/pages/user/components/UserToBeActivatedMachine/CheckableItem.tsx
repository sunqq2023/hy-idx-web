import { Checkbox } from 'antd-mobile'
import {
  selectedSvg,
  userMachineSvg,
  toBeActiveSvg,
  startedSvg
} from '@/assets'
import { MachineInfo } from '@/constants/types'
import AdaptiveNumber, { NumberType } from '@/components/AdaptiveNumber'
import { formatEther } from 'viem'
import { generateCode } from '@/utils/helper'

const CheckableItem = ({
  item,
  onLeftClick,
  onRightClick
}: {
  item: MachineInfo
  onLeftClick: (e: MachineInfo) => void
  onRightClick: (e: MachineInfo) => void
}) => {
  const isActivate = () => {
    return item.isOnSale || item.isActivatedStakedLP
  }

  const getRemainingLife = (producedMix) => {
    return Math.floor((360 * (1440 - getFormattedMix(producedMix))) / 1440)
  }

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
      className="bg-white rounded-2xl p-2  flex justify-between mt-2 text-[.68rem]"
    >
      <div className="flex relative" onClick={() => onLeftClick(item)}>
        {!isActivate() && (
          <Checkbox
            checked={item.checked}
            icon={(checked) =>
              checked ? (
                <img src={selectedSvg} alt="" width={16} height={16} />
              ) : (
                <div className="border border-[#a5a4a4] w-[1rem] h-[1rem] rounded-[50%]" />
              )
            }
          />
        )}

        <img src={userMachineSvg} alt="" width={58} className="mx-2" />
      </div>

      <div
        className="basis-5/7 h-[58px] flex flex-col gap-1.5 justify-center"
        onClick={() => onRightClick(item)}
      >
        <div className="flex justify-between">
          <div
            className={'flex rounded-3xl pr-3'}
            style={{
              background:
                'linear-gradient(90deg, rgba(165, 115, 71, 0) 0%, rgba(187, 112, 84, 1) 100%)'
            }}
          >
            #{generateCode(item.id)}
            <div className="text-white ml-3">矿机</div>
          </div>
          <div className="text-[#15b268] flex gap-1">
            <img
              src={isActivate() ? startedSvg : toBeActiveSvg}
              alt=""
              width={50}
            />
          </div>
        </div>

        <div className="flex gap-1">
          累计产出通证：
          <div className="font-bold text-[12px] flex gap-1">
            <AdaptiveNumber
              type={NumberType.BALANCE}
              value={getFormattedMix()}
              decimalSubLen={2}
              className="font-bold"
            />
            <span>MIX</span>
          </div>
        </div>

        <div className="flex gap-1">
          矿机生命剩余：
          <div className="font-bold text-[12px]">
            {getRemainingLife(item.producedMix)}天
          </div>
        </div>
      </div>
    </div>
  )
}
export default CheckableItem
