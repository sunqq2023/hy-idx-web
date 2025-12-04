import { Checkbox, ProgressBar } from 'antd-mobile';
import classNames from 'classnames';
import styles from '@/pages/SalePersonPage.module.css';
import { purpleMiningMachineSvg, selectedSvg, lockGreenSvg } from '@/assets';
import dayjs from 'dayjs';
import { SHA256 } from 'crypto-js';
import { MachineInfo } from '@/constants/types';

// 获取矿机名称（母矿机/子矿机）
const getMachineName = (val: number): string => {
  return val === 1 ? '母矿机' : '子矿机';
};

// 计算剩余寿命百分比
const getPercent = (
  producedChildCount: number,
  unclaimedChildCount: number
): number => {
  const remainingLife = 90 - (producedChildCount + unclaimedChildCount) * 10;
  return Math.max(0, Math.min(100, (remainingLife / 90) * 100)); // 确保百分比在0-100之间
};

// 计算剩余寿命天数
const getRemainingLife = (
  producedChildCount: number,
  unclaimedChildCount: number
): number => {
  return Math.max(0, 90 - (producedChildCount + unclaimedChildCount) * 10); // 确保天数不为负
};

// 生成矿机编号（如#EFFC50C1格式）
export const generateCode = (num: number): string => {
  if (typeof num !== 'number' || isNaN(num)) {
    return 'INVALID'; // 处理无效ID
  }
  
  const input = num.toString();
  const hashHex = SHA256(input).toString();
  
  // 提取前4位字母（如无则用默认值）
  const letterPart = 
    hashHex.match(/[a-zA-Z]/g)?.slice(0, 4).join('') || 'ABCD';
  
  // 提取第10-13位十六进制字符
  const hexPart = hashHex.slice(10, 14).padEnd(4, '0'); // 确保长度为4
  
  return (letterPart + hexPart).toUpperCase();
};

// 格式化时间戳
const formatTimestamp = (timestamp: number): string => {
  if (typeof timestamp !== 'number' || timestamp <= 0) {
    return '未知时间';
  }
  return dayjs.unix(timestamp).format('YYYY/MM/DD HH:mm:ss');
};

interface CheckableItemProps {
  item: MachineInfo;
  onLeftClick: (e: MachineInfo) => void;
  onRightClick: (e: MachineInfo) => void;
}

const CheckableItem = ({
  item,
  onLeftClick,
  onRightClick
}: CheckableItemProps) => {
  // 确保item存在（防御性编程）
  if (!item) {
    return null;
  }

  return (
    <div
      key={item.id}
      className="container-wrap flex justify-between mt-4 text-[.68rem]"
    >
      <div 
        className="flex relative" 
        onClick={() => onLeftClick(item)}
        aria-label="选择矿机"
      >
        <Checkbox
          checked={item.checked ?? false} // 处理checked可能为undefined的情况
          icon={(checked) =>
            checked ? (
              <img src={selectedSvg} alt="已选中" width={16} height={16} />
            ) : (
              <div className="border border-[#a5a4a4] w-[1rem] h-[1rem] rounded-[50%]" />
            )
          }
        />

        <img 
          src={purpleMiningMachineSvg} 
          alt="矿机图标" 
          width={58} 
          className="mx-2" 
        />
      </div>

      <div
        className="basis-5/7 h-full flex flex-col gap-1"
        onClick={() => onRightClick(item)}
        aria-label="查看矿机详情"
      >
        <div className="flex justify-between mb-2">
          <div
            className={classNames(
              styles['machine-name'],
              'flex rounded-3xl pr-3'
            )}
          >
            #{generateCode(item.id ?? 0)} {/* 处理id可能为undefined的情况 */}
            <div className="text-white ml-3">
              {getMachineName(item.mtype ?? 0)} {/* 处理mtype可能为undefined的情况 */}
            </div>
          </div>
          <div className="text-[#15b268] flex gap-1">
            <img src={lockGreenSvg} alt="状态图标" width={13} />
            {item.activatedAt > 0 ? '已激活' : '未激活'}
          </div>
        </div>

        <div className="flex gap-2">
          <div>生命剩余</div>
          <ProgressBar
            percent={getPercent(
              item.producedChildCount ?? 0,
              item.unclaimedChildCount ?? 0
            )}
            className="w-[60%]"
            style={{
              '--fill-color': '#615371'
            }}
          />

          <div>
            {getRemainingLife(
              item.producedChildCount ?? 0,
              item.unclaimedChildCount ?? 0
            )}
            天
          </div>
        </div>

        <div className="flex justify-end">
          创建于 {formatTimestamp(item.createTime ?? 0)}
        </div>
      </div>
    </div>
  );
};

export default CheckableItem;
