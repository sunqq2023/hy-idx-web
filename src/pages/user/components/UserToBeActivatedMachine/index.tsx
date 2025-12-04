import { arrowSvg } from '@/assets'
import { Swiper, SwiperRef, Tabs } from 'antd-mobile'
import classNames from 'classnames'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './UserToBeActivatedMachine.module.css'

import MotherMachine from './MotherMachine'
import Machine from './Machine'
import SyntheticNode from './SyntheticNode'

const UserToBeActivatedMachine = () => {
  const navigate = useNavigate()
  const handlBack = () => {
    navigate('/user')
  }

  const ref = useRef<SwiperRef>(null)
  const [tabKey, setTabKey] = useState('0')
  const DEFAULT_INDEX = 0

  const tabs = [
    {
      title: '母矿机',
      children: <MotherMachine />
    },

    {
      title: '矿机',
      children: <Machine isShow={tabKey === '1'} />
    },
    {
      title: '节点',
      children: <SyntheticNode />
    }
  ]

  return (
    <div className="h-full overflow-hidden text-[16px] relative">
      <div className="flex pt-4 w-full h-full justify-between">
        <div
          className="h-[50px] flex items-center absolute top-[10px] left-[20px] "
          onClick={handlBack}
        >
          <img src={arrowSvg} alt="" />
        </div>
        <div className="w-full h-full flex flex-col justify-between">
          <Tabs
            activeKey={tabKey}
            onChange={(key) => {
              setTabKey(`${key}`)
              ref?.current?.swipeTo(Number(key))
            }}
            className={classNames(
              [styles['adm-tabs']],
              `w-[70%]  mx-auto flex justify-around
              !shrink-0  [&_.adm-tabs-tab-wrapper]:flex-none [&_.adm-tabs-tab-wrapper]:px-0
              [&_.adm-tabs-tab.adm-tabs-tab-active]:font-medium [&_.adm-tabs-tab.adm-tabs-tab-active]:opacity-100
              [&_.adm-tabs-tab]:pb-[11px] [&_.adm-tabs-tab]:pt-[14px] [&_.adm-tabs-tab]:text-[15px]
              [&_.adm-tabs-tab]:opacity-40 [&_.adm-tabs-tab]:transition-transform
          `
            )}
            style={{
              '--title-font-size': '16px'
            }}
          >
            {tabs.map((tab, index) => (
              <Tabs.Tab key={index} title={tab.title} className="" />
            ))}
          </Tabs>

          <Swiper
            className="flex-1 outline-0 "
            ref={ref}
            indicator={() => null}
            tabIndex={Number(tabKey)}
            defaultIndex={DEFAULT_INDEX}
            onIndexChange={(index) => setTabKey(`${index}`)}
          >
            {tabs.map((tab, index) => (
              <Swiper.Item
                key={index}
                className="no-scrollbar max-w-full overflow-x-hidden overflow-y-auto"
              >
                {tab.children}
              </Swiper.Item>
            ))}
          </Swiper>
        </div>
      </div>
    </div>
  )
}

export default UserToBeActivatedMachine
