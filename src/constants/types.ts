export interface MachineInfo {
  activatedAt: number
  createTime: number
  expiredAt: number

  destroyed: boolean
  isActivatedStakedLP: boolean
  isOnSale?: boolean

  isFuelPaid: boolean
  isProducing: boolean
  mtype: number
  status?: string
  checked: boolean
  id: number
  lastProduceTime: number
  producedChildCount: number
  producedHours: number
  fuelRemainingMinutes: number

  unclaimedChildCount?: number
  producedMix?: number
  unclaimedMix?: number
}
