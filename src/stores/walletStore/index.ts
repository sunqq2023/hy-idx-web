import { observable, autorun, action, computed, IComputedValue } from 'mobx'

interface IWalletStore {
    chainId: number
    walletChainIdActions: (id: number) => void
    getWalletChainId: IComputedValue<number>
}

const walletStore: IWalletStore = observable({
    chainId: 1,
    walletChainIdActions: action((id: number) => {
        walletStore.chainId = walletStore.chainId + id
    }),
    getWalletChainId: computed(() => {
        return walletStore.chainId
    })
})

autorun(() => {
    console.log({
        key: 'walletStore',
        walletStore
    })
})

export default walletStore
