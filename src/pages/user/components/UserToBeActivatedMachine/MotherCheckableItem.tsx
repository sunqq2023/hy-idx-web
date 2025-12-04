import { Checkbox } from 'antd-mobile'
import {
  selectedSvg,
  startedSvg,
  toBeActiveSvg,
  purpleMiningMachineSvg
} from '@/assets'
import { SHA256 } from 'crypto-js'
import { MachineInfo } from '@/constants/types'
import classNames from 'classnames'
import dayjs from 'dayjs'
import { formatTime } from '@/utils/helper'

const getRemainingLife = (
  isActivatedStakedLP: boolean,
  lastProduceTime: number,
  activatedAt: number
) => {
  if (isActivatedStakedLP) {
    const now = new Date().getTime()
    const diffInMs = Math.abs(now - activatedAt * 1000)
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    return 90 - diffInDays
  }
  return 90
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
    return item.isActivatedStakedLP
  }

  return (
    <div
      key={item.id}
      className={classNames(
        'bg-white p-2 flex justify-between mt-2 text-[.68rem] rounded-[24px]'
      )}
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

        <img
          src={purpleMiningMachineSvg}
          alt=""
          className="mx-2 w-[3.625rem]"
        />
      </div>

      <div
        className="basis-5/7 h-[58px] flex flex-col mt-1 gap-1"
        onClick={() => onRightClick(item)}
      >
        <div className="flex justify-between">
          <div
            className={'flex rounded-3xl pr-3'}
            style={{
              background:
                'linear-gradient(90deg, rgba(148, 61, 249, 0) 0%, rgba(148, 61, 249, 1) 100%)'
            }}
          >
            #{generateCode(item.id)}
            <div className="text-white ml-3">母矿机</div>
          </div>
          <div className="text-[#15b268] flex gap-1">
            <img
              src={isActivate() ? startedSvg : toBeActiveSvg}
              alt=""
              width={50}
            />
          </div>
        </div>

        {isActivate() ? (
          <>
            <div className="flex gap-1">
              累计产出矿机：
              <div className="font-bold flex gap-1">
                <div>{item.producedChildCount}</div>个
              </div>
            </div>

            <div className="flex gap-1">
              矿机生命剩余：
              <div>
                {getRemainingLife(
                  item.isActivatedStakedLP,
                  item.lastProduceTime,
                  item.activatedAt
                )}
              </div>
              天
            </div>
          </>
        ) : (
          <>
            <div className="flex mt-2">
              生命剩余：
              <div>
                {getRemainingLife(
                  item.isActivatedStakedLP,
                  item.lastProduceTime,
                  item.activatedAt
                )}
              </div>
              天
            </div>
          </>
        )}
      </div>
    </div>
  )
}
export default CheckableItem
