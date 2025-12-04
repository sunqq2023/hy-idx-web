// import React, { memo, ReactElement, useMemo } from 'react'
// import { useLocation, useNavigate, Link } from 'react-router-dom'
// import { Routers } from 'router'
// import { useHapticFeedback } from '@vkruglikov/react-telegram-web-app'
// import MarketIcon from 'assets/imgs/tabbar/market.svg?react'
// import MarketSelectIcon from 'assets/imgs/tabbar/market-selected.svg?react'
// import SwapIcon from 'assets/imgs/tabbar/swap2.svg?react'
// import SwapSelectIcon from 'assets/imgs/tabbar/swap-selected.svg?react'
// import TaskIcon from 'assets/imgs/tabbar/task.svg?react'
// import TaskSelectIcon from 'assets/imgs/tabbar/task-selected.svg?react'
// import HomeIcon from 'assets/imgs/tabbar/home.svg?react'
// import HomeSelectIcon from 'assets/imgs/tabbar/home-selected.svg?react'
// import { classNames } from 'utils'
// import { SafeArea } from 'antd-mobile'

import { memo } from 'react'

// interface TabItem {
//   key: string
//   title: string
//   icon: ReactElement<any, any>
//   activeIcon: ReactElement<any, any>
//   url: string
//   link: string
// }

const BaseTabBar = () => {
  // const navigate = useNavigate()
  // const [handleImpact] = useHapticFeedback()
  // const location = useLocation()
  // const pathname = location.pathname

  // const tabs: TabItem[] = useMemo(() => {
  //   return [
  //     {
  //       key: 'market',
  //       title: 'Market',
  //       icon: <MarketIcon />,
  //       activeIcon: <MarketSelectIcon />,
  //       url: Routers.market.root,
  //       link: '/market'
  //     },
  //     {
  //       key: 'swap',
  //       title: 'Swap',
  //       icon: <SwapIcon />,
  //       activeIcon: <SwapSelectIcon />,
  //       url: Routers.swap,
  //       link: '/swap'
  //     },
  //     {
  //       key: 'task',
  //       title: 'Task',
  //       icon: <TaskIcon />,
  //       activeIcon: <TaskSelectIcon />,
  //       url: Routers.task,
  //       link: '/task'
  //     },
  //     {
  //       key: 'wallet',
  //       title: 'Wallet',
  //       icon: <HomeIcon />,
  //       activeIcon: <HomeSelectIcon />,
  //       url: Routers.index,
  //       link: '/'
  //     }
  //   ]
  // }, [])

  // const onChange = (tab: TabItem) => {
  //   // navigate(tab.url, { state: { fromTab: true } })

  //   if (navigator && 'vibrate' in navigator) {
  //     navigator.vibrate(50)
  //   } else {
  //     handleImpact('light')
  //   }
  // }

  return (
    <>
      <div>TabBar</div>
      {/* <div className="fixed bottom-0 z-50 grid w-full shrink-0 grid-cols-4 gap-[5px] bg-white  shadow-[0_0_-4px_0_rgba(0,0,0,0.1)]">
        {tabs.map((item) => (
          <Link key={item.key} to={item.link}>
            <div
              className={`flex h-[--page-tabbar-height] w-full flex-1 cursor-pointer items-center justify-center px-[10px] font-normal`}
              onClick={() => onChange(item)}
            >
              <div className={`flex flex-col items-center gap-[4px]`}>
                {pathname === item.url ? item.activeIcon : item.icon}
                <div
                  className={classNames('text-[11px] leading-[17px]', [
                    pathname === item.url
                      ? 'text-[#F21F7F] font-medium'
                      : 'text-[#A4A4B2]'
                  ])}
                >
                  {item.title}
                </div>
              </div>
            </div>
          </Link>
        ))}
        <SafeArea position="bottom" style={{ '--multiple': 0.5 }} />
      </div> */}
    </>
  )
}

export default memo(BaseTabBar)
