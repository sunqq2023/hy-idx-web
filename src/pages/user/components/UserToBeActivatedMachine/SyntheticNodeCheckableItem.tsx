import { Checkbox } from 'antd-mobile'
import {
  selectedSvg,
  startedSvg,
  toBeActiveSvg,
  purpleMiningMachineSvg,
  userMachineSvg,
  wreckageSvg
} from '@/assets'
import { SHA256 } from 'crypto-js'
import { MachineInfo } from '@/constants/types'
import classNames from 'classnames'

const getRemainingLife = (
  producedChildCount: number,
  unclaimedChildCount: number
) => {
  return 90 - (producedChildCount + unclaimedChildCount) * 10
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

const getMachineImg = (type: number) => {
  return type === 1 ? purpleMiningMachineSvg : userMachineSvg
}
const getMachineName = (type: number) => {
  return type === 1 ? '母矿机' : '矿机'
}

const SyntheticNodeCheckableItem = ({
  item,
  onLeftClick
}: {
  item: MachineInfo
  onLeftClick: (e: MachineInfo) => void
}) => {
  return (
    <div
      key={item.id}
      className={classNames(
        'p-2 bg-white flex justify-between mt-2 text-[.68rem] rounded-[24px]'
      )}
    >
      <div className="flex relative" onClick={() => onLeftClick(item)}>
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

        {/* <img
          src={getMachineImg(item.mtype)}
          alt=""
          width={58}
          className="mx-2"
        /> */}
        <div className="bg-black w-[58px] h-[58px] mx-2 rounded-2xl"></div>
      </div>

      <div className="basis-5/7  flex flex-col justify-center gap-2">
        <div className="flex justify-between">
          <div
            className={'flex justify-center rounded-3xl  w-[80px]'}
            // style={{
            //   background:
            //     'linear-gradient(90deg, rgba(148, 61, 249, 0) 0%, rgba(148, 61, 249, 1) 100%)'
            // }}
          >
            {/* #{generateCode(item.id)} */}
            <div className="w-full pr-2">
              {/* {getMachineName(item.mtype)} */}
              矿机
            </div>
          </div>
          <div className="text-[#15b268] flex gap-1">
            <img src={wreckageSvg} alt="" width={65} />
          </div>
        </div>

        <div className="flex">生命剩余： 0 天</div>
      </div>
    </div>
  )
}

export default SyntheticNodeCheckableItem
