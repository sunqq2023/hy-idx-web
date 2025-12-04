import { useEffect, useRef } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { useNavigate } from 'react-router-dom'

export function useWalletChangeRedirect() {
  const { address, connector, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const navigate = useNavigate()
  const prevAddressRef = useRef<string | undefined>()
  const redirectingRef = useRef(false)

  useEffect(() => {
    if (!isConnected) {
      prevAddressRef.current = undefined
      return
    }

    // 首次连接时存储地址
    if (!prevAddressRef.current) {
      prevAddressRef.current = address
      return
    }

    // 检测地址变化
    if (
      address &&
      prevAddressRef.current !== address &&
      !redirectingRef.current
    ) {
      redirectingRef.current = true
      console.log(
        `Wallet address changed from ${prevAddressRef.current} to ${address}`
      )

      // disconnect() // 主动断开当前连接
      navigate('/') // 重定向到根目录

      // 强制刷新页面以确保状态完全重置
      setTimeout(() => window.location.reload(), 500)
    }

    prevAddressRef.current = address
  }, [address, isConnected, disconnect, navigate])

  // 监听标准钱包事件
  useEffect(() => {
    if (!isConnected) return

    const handleAccountChange = (accounts: string[]) => {
      const newAddress = accounts[0]
      if (
        newAddress &&
        address &&
        newAddress.toLowerCase() !== address.toLowerCase()
      ) {
        console.log('aaaaa')
        // disconnect()
        navigate('/')
        setTimeout(() => window.location.reload(), 500)
      }
    }

    // 监听标准 EIP-1193 事件
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountChange)
    }

    // 监听 WalletConnect 事件
    if (connector?.id === 'walletConnect') {
      const provider = (window as any).WalletConnect?.provider
      if (provider) {
        provider.on('accountsChanged', handleAccountChange)
        provider.on('disconnect', () => {
          console.log('bbbbb')
          // disconnect()
          navigate('/')
        })
      }
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountChange)
      }
      if (connector?.id === 'walletConnect') {
        const provider = (window as any).WalletConnect?.provider
        if (provider) {
          provider.removeListener('accountsChanged', handleAccountChange)
          provider.removeListener('disconnect', () => {})
        }
      }
    }
  }, [isConnected, address, connector, disconnect, navigate])
}
