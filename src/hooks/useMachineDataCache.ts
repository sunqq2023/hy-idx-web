import { useState, useCallback, useRef } from 'react'

// 矿机数据缓存类型
interface MachineData {
  id: number
  activatedAt: number
  createTime: number
  expiredAt: number
  destroyed: boolean
  isActivatedStakedLP: boolean
  isFuelPaid: boolean
  isProducing: boolean
  lastProduceTime: number
  producedChildCount: number
  producedHours: number
  mtype: number
  fuelRemainingMinutes: number
  checked: boolean
  // 扩展字段
  producedMix?: number
  isOnSale?: boolean
  claimableChildren?: number
  lastUpdated?: number
}

// 缓存管理类
class MachineDataCache {
  private cache = new Map<number, MachineData>()
  private lastUpdateTime = new Map<number, number>()
  private readonly TTL = 30000 // 30秒缓存时间

  // 检查数据是否有效
  isValid(machineId: number): boolean {
    const lastUpdate = this.lastUpdateTime.get(machineId)
    if (!lastUpdate) return false
    return Date.now() - lastUpdate < this.TTL
  }

  // 获取缓存数据
  get(machineId: number): MachineData | null {
    if (!this.isValid(machineId)) {
      this.cache.delete(machineId)
      this.lastUpdateTime.delete(machineId)
      return null
    }
    return this.cache.get(machineId) || null
  }

  // 设置缓存数据
  set(machineId: number, data: MachineData): void {
    this.cache.set(machineId, { ...data, lastUpdated: Date.now() })
    this.lastUpdateTime.set(machineId, Date.now())
  }

  // 批量设置
  setBatch(dataMap: Map<number, MachineData>): void {
    dataMap.forEach((data, machineId) => {
      this.set(machineId, data)
    })
  }

  // 获取需要查询的矿机ID列表
  getMissingIds(machineIds: number[]): number[] {
    return machineIds.filter(id => !this.isValid(id))
  }

  // 清除缓存
  clear(): void {
    this.cache.clear()
    this.lastUpdateTime.clear()
  }

  // 清除特定矿机缓存
  clearMachine(machineId: number): void {
    this.cache.delete(machineId)
    this.lastUpdateTime.delete(machineId)
  }
}

// 查询状态管理
interface QueryState {
  isQuerying: boolean
  queryingIds: Set<number>
  lastQueryTime: number
}

export const useMachineDataCache = () => {
  const cacheRef = useRef(new MachineDataCache())
  const [queryState, setQueryState] = useState<QueryState>({
    isQuerying: false,
    queryingIds: new Set(),
    lastQueryTime: 0
  })

  // 获取缓存数据
  const getCachedData = useCallback((machineId: number): MachineData | null => {
    return cacheRef.current.get(machineId)
  }, [])

  // 设置缓存数据
  const setCachedData = useCallback((machineId: number, data: MachineData): void => {
    cacheRef.current.set(machineId, data)
  }, [])

  // 批量设置缓存数据
  const setCachedDataBatch = useCallback((dataMap: Map<number, MachineData>): void => {
    cacheRef.current.setBatch(dataMap)
  }, [])

  // 获取需要查询的矿机ID
  const getMissingIds = useCallback((machineIds: number[]): number[] => {
    return cacheRef.current.getMissingIds(machineIds)
  }, [])

  // 检查是否正在查询
  const isQuerying = useCallback((machineId?: number): boolean => {
    if (machineId) {
      return queryState.queryingIds.has(machineId)
    }
    return queryState.isQuerying
  }, [queryState])

  // 设置查询状态
  const setQuerying = useCallback((machineIds: number[], isQuerying: boolean) => {
    setQueryState(prev => {
      const newQueryingIds = new Set(prev.queryingIds)
      if (isQuerying) {
        machineIds.forEach(id => newQueryingIds.add(id))
      } else {
        machineIds.forEach(id => newQueryingIds.delete(id))
      }
      return {
        isQuerying: newQueryingIds.size > 0,
        queryingIds: newQueryingIds,
        lastQueryTime: !isQuerying ? Date.now() : prev.lastQueryTime  // 在查询完成时设置时间
      }
    })
  }, [])

  // 清除缓存
  const clearCache = useCallback(() => {
    cacheRef.current.clear()
  }, [])

  // 清除特定矿机缓存
  const clearMachineCache = useCallback((machineId: number) => {
    cacheRef.current.clearMachine(machineId)
  }, [])

  // 检查是否可以查询（防抖）
  const canQuery = useCallback((machineId: number): boolean => {
    const lastQuery = queryState.lastQueryTime
    const now = Date.now()
    
    // 如果正在查询该矿机，则不能重复查询
    if (queryState.queryingIds.has(machineId)) {
      return false
    }
    
    // 如果距离上次查询不足1秒，则不能查询
    if (now - lastQuery < 1000) {
      return false
    }
    
    return true
  }, [queryState])

  return {
    getCachedData,
    setCachedData,
    setCachedDataBatch,
    getMissingIds,
    isQuerying,
    setQuerying,
    clearCache,
    clearMachineCache,
    canQuery
  }
}

export type { MachineData }
