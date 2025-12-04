import { makeAutoObservable } from 'mobx'

class UserStore {
  isLoggedIn = false
  userInfo: { address: `0x${string}` } | null = null

  constructor() {
    makeAutoObservable(this)
  }

  login = (userData: { address: `0x${string}` }) => {
    this.isLoggedIn = true
    this.userInfo = userData
  }

  logout = () => {
    this.isLoggedIn = false
    this.userInfo = null
  }
}

export const userStore = new UserStore()
