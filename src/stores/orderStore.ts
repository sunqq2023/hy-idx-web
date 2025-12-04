import { makeAutoObservable, toJS } from 'mobx'
import { makePersistable } from 'mobx-persist-store'

class OrderStore {
  orders: any = []
  unPaidLength: number = 0
  allListedOrders: any = []

  constructor() {
    makeAutoObservable(this)

    makePersistable(this, {
      name: 'orders',
      properties: ['orders', 'unPaidLength', 'allListedOrders'],
      storage: window.localStorage
    })
  }

  updateData(newData: any, length: number) {
    this.orders = newData
    this.unPaidLength = length
  }

  updateAllListedOrders(newData: any) {
    this.allListedOrders = newData
  }

  clearData() {
    // 清除所有持久化的数据
    localStorage.removeItem('orders')

    // 重置store状态
    this.orders = []
    this.unPaidLength = 0
    this.allListedOrders = []
  }

  getOrders() {
    return toJS(this.orders)
  }

  getUnPaidLength() {
    return toJS(this.unPaidLength)
  }
  getallListedOrders() {
    return toJS(this.allListedOrders)
  }
}

const orderStore = new OrderStore()

export default orderStore
