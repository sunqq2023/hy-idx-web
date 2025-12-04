// import { CommonStore } from './commonStore'

// // 实例化所有 store
// const commonStore = new CommonStore()

// // 导出所有 store 实例
// const stores = {
//   commonStore
// }

// export default stores

import React, { useContext } from 'react'
import walletStore from './walletStore'

const stores = React.createContext(walletStore)

export const useStore = () => useContext(stores)

export default stores
