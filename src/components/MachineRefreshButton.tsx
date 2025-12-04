import React, { useState, useCallback } from 'react'
import { Button, Toast } from 'antd-mobile'
import { useMachineDataCache } from '@/hooks/useMachineDataCache'
import { useVisibleMachineQuery } from '@/hooks/useVisibleMachineQuery'

interface MachineRefreshButtonProps {
  machineId: number
  onRefresh?: (machineId: number, newData: any) => void
  size?: 'mini' | 'small' | 'middle' | 'large'
  className?: string
}

const MachineRefreshButton: React.FC<MachineRefreshButtonProps> = ({
  machineId,
  onRefresh,
  size = 'mini',
  className = ''
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { clearMachineCache, canQuery } = useMachineDataCache()
  const { querySingleMachine } = useVisibleMachineQuery([])

  const handleRefresh = useCallback(async () => {
    // 检查是否可以刷新
    if (!canQuery(machineId)) {
      Toast.show('刷新过于频繁，请稍后再试')
      return
    }

    setIsRefreshing(true)
    
    try {
      // 清除该矿机的缓存
      clearMachineCache(machineId)
      
      // 重新查询数据
      const newData = await querySingleMachine(machineId)
      
      if (newData) {
        // 通知父组件数据已更新
        onRefresh?.(machineId, newData)
        Toast.show('刷新成功')
      } else {
        Toast.show('刷新失败，请重试')
      }
    } catch (error) {
      console.error('刷新矿机数据失败:', error)
      Toast.show('刷新失败，请重试')
    } finally {
      setIsRefreshing(false)
    }
  }, [machineId, canQuery, clearMachineCache, querySingleMachine, onRefresh])

  return (
    <Button
      size={size}
      loading={isRefreshing}
      onClick={handleRefresh}
      className={`machine-refresh-button ${className}`}
      style={{
        minWidth: '60px',
        height: '28px',
        fontSize: '12px',
        padding: '0 8px'
      }}
    >
      {isRefreshing ? '刷新中' : '刷新'}
    </Button>
  )
}

export default MachineRefreshButton
