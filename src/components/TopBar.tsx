import { useAccount } from 'wagmi'
import TopBarConnectButton from '@/components/TopBarConnectButton'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

const TopBar = () => {
  const { isConnected } = useAccount()

  const navigate = useNavigate()

  useEffect(() => {
    if (!isConnected) {
      navigate('/')
    }
  }, [isConnected, navigate])

  return (
    <div className="flex justify-between py-2 px-[21px] bg-white">
      <TopBarConnectButton />
    </div>
  )
}

export default TopBar
