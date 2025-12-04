import {
  UIEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import style from './ListWithUncertainHeight.module.css'

// const listData = new Array(1000).fill(1).map((_, i) => {
//   return {
//     id: i,
//     value: i + 1
//   }
// })

interface Item {
  id: number
  time: string
  makenum: number
  num: number
  name: string
  rate: string
  address: string
}

const ListWithUncertainHeight = ({ listData }: { listData: Item[] }) => {
  const estimatedItemSize = 240
  // 根据预估高度初始化
  const positions = listData.map((_, i) => {
    return {
      index: i,
      height: estimatedItemSize,
      top: i * estimatedItemSize,
      bottom: (i + 1) * estimatedItemSize
    }
  })

  // 缓冲区个数与可视区个数的比例，上下缓冲区是分开计算的
  const bufferScale = 1

  const containerRef = useRef(null)

  const [screenHeight, setScreenHeight] = useState(0)
  const [startOffset, setStartOffset] = useState(0)
  const [startIndex, setStartIndex] = useState<null | number>(0)
  const [endIndex, setEndIndex] = useState<null | number>(0)

  const phantomRef = useRef(null)
  const items = useRef<Record<number, HTMLElement | null>>({})

  const visibleCount = useMemo(() => {
    return Math.ceil(screenHeight / estimatedItemSize)
  }, [screenHeight])

  // 上方缓冲区数量
  const aboveCount = useMemo(() => {
    if (startIndex !== null) {
      return Math.min(startIndex, bufferScale * visibleCount)
    }
    return 0
  }, [startIndex, visibleCount])

  // 下方缓冲区数量
  const belowCount = useMemo(() => {
    if (endIndex !== null) {
      return Math.min(listData.length - endIndex, bufferScale * visibleCount)
    }
    return 0
  }, [visibleCount, endIndex, listData.length])

  const visibleData = useMemo(() => {
    if (startIndex !== null && endIndex !== null) {
      const newStartIndex = startIndex - aboveCount
      const newEndIndex = endIndex + belowCount
      return listData.slice(newStartIndex, newEndIndex)
    }
    return listData.slice(0, visibleCount)
  }, [startIndex, endIndex, aboveCount, belowCount, visibleCount, listData])

  // 每次visibleData变化时清理不存在的ref
  useEffect(() => {
    const currentIds = new Set(visibleData.map((item) => item.id))
    Object.keys(items.current).forEach((id) => {
      if (!currentIds.has(Number(id))) {
        items.current[Number(id)] = null
      }
    })
  }, [visibleData])

  useEffect(() => {
    items.current = new Array(listData.length).fill(null)
  }, [listData.length])

  // 修改ref回调
  const setItemRef = useCallback((el: HTMLElement | null, id: number) => {
    if (el) {
      items.current[id] = el
    } else {
      // 当元素卸载时，保留null值避免数组塌陷
      items.current[id] = null
    }
  }, [])

  useEffect(() => {
    const current = containerRef.current
    if (current) {
      setScreenHeight(current.clientHeight)
    }
    setEndIndex(0 + visibleCount)
  }, [containerRef, visibleCount])

  // 修改ItemSize
  const updateItemsSize = useCallback(() => {
    visibleData.forEach((item) => {
      const node = items.current[item.id]
      if (!node) return

      const rect = node.getBoundingClientRect()
      const height = rect.height
      const index = item.id // 使用真实ID
      const oldHeight = positions[index].height
      const dValue = oldHeight - height

      if (dValue) {
        positions[index].bottom -= dValue
        positions[index].height = height

        for (let k = index + 1; k < positions.length; k++) {
          positions[k].top = positions[k - 1].bottom
          positions[k].bottom -= dValue
        }
      }
    })
  }, [visibleData, positions])

  const setListStartOffset = useCallback(() => {
    if (startIndex && startIndex >= 1) {
      const size =
        positions[startIndex].top -
        (positions[startIndex - aboveCount]
          ? positions[startIndex - aboveCount].top
          : 0)
      const offset = positions[startIndex - 1].bottom - size
      setStartOffset(offset)
    } else {
      setStartOffset(0)
    }
  }, [startIndex, aboveCount, positions])

  /* 
     每次渲染之后，获取dom的真实高度，替换positions里的预估高度
  */
  useEffect(() => {
    requestAnimationFrame(() => {
      if (!items.current || !items.current.length) {
        return
      }
      updateItemsSize()
      const height = positions[positions.length - 1].bottom
      if (phantomRef.current) {
        phantomRef.current.style.height = height + 'px'
        setListStartOffset()
      }
    })
  }, [items, setListStartOffset, updateItemsSize, positions])

  const getStartIndex = (scrollTop = 0) => {
    return binarySearch(positions, scrollTop)
  }

  const binarySearch = (list, value) => {
    let start = 0
    let end = list.length - 1
    let tempIndex = null
    while (start <= end) {
      const midIndex = parseInt((start + end) / 2)
      const midValue = list[midIndex].bottom
      if (midValue === value) {
        return midIndex + 1
      } else if (midValue < value) {
        start = midIndex + 1
      } else if (midValue > value) {
        if (tempIndex === null || tempIndex > midIndex) {
          tempIndex = midIndex
        }
        end = end - 1
      }
    }
    return tempIndex
  }

  const handleContainerScroll = (e: UIEvent) => {
    const target = e.target as HTMLElement
    const newStartIndex = getStartIndex(target.scrollTop)
    setStartIndex(newStartIndex)
    if (newStartIndex !== null) {
      setEndIndex(Math.min(newStartIndex + visibleCount, listData.length - 1))
    }
    setListStartOffset()
  }

  return (
    <div
      ref={containerRef}
      className={style.container}
      id="container"
      onScroll={handleContainerScroll}
    >
      <div ref={phantomRef} className={style.phantom}></div>
      <div
        className={style.list}
        id="list"
        style={{
          transform: `translate3d(0,${startOffset}px,0)`
        }}
      >
        {visibleData.length > 0 &&
          visibleData.map((e) => {
            return (
              <div
                ref={(el) => setItemRef(el, e.id)}
                key={e.id}
                className={style.item}
              >
                {/* <p>
                  <span className="text-[red]">{e.id}</span>
                  {e.value}
                </p> */}
                <HistoryItme item={e} />
              </div>
            )
          })}
      </div>
    </div>
  )
}

export default ListWithUncertainHeight
