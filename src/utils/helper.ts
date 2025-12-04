import { createHash } from 'crypto'
import { BigNumber } from 'bignumber.js'
import dayjs from 'dayjs'
import { SHA256 } from 'crypto-js'

export const shortenAddress = (
  address: string | undefined,
  start?: number,
  end?: number
) => {
  if (!address) return ''
  if (address?.length <= 11) {
    return address
  }
  return (
    address && `${address.slice(0, start || 8)}...${address.slice(-(end || 8))}`
  )
}
export const longAddress = (address: string | null | undefined) => {
  if (!address) return ''
  return shortenAddress(address, 10, 12)
}
export const intRandom = (min: number, max: number) => {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export const formatTime = (timestamp: number) => {
  return dayjs.unix(timestamp).format('YYYY/MM/DD HH:mm:ss')
}

export const generateCode = (num: number) => {
  const input = num + ''
  const hashHex = SHA256(input).toString()
  // 提取前4位字母和后4位十六进制
  const letterPart =
    hashHex
      .match(/[a-zA-Z]/g)
      ?.slice(0, 4)
      .join('') || 'ABCD'
  const hexPart = hashHex.slice(10, 14)

  return (letterPart + hexPart).toUpperCase()
}

export function convertTimestampToDateText(unixTimestamp: number) {
  const date = new Date(unixTimestamp)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function secondsToMinutes(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  const formattedMinutes = String(minutes).padStart(2, '0')
  const formattedSeconds = String(remainingSeconds).padStart(2, '0')

  return `${formattedMinutes}:${formattedSeconds}`
}

export const capitalizeFirstLetter = (str: string | undefined) =>
  typeof str === 'string'
    ? str?.replace(/^[a-z]/i, (letter) => letter.toUpperCase())
    : ''

export const md5 = (input: string): string => {
  return createHash('md5').update(input).digest('hex')
}
export const isEmpty = (data: string | object) => {
  if (data instanceof Array) {
    return !data.length
  } else if (data instanceof Object) {
    return !Object.keys(data).length
  }
  return !data
}

export function findAndModifyLongestValue(
  obj: Record<string, any[]>
): Record<string, any[]> {
  const newObj = { ...obj }

  let longestKey: string | null = null
  let maxLength = 0

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key]
      if (value.length > maxLength) {
        longestKey = key
        maxLength = value.length
      }
    }
  }

  if (longestKey !== null && newObj[longestKey].length >= 2) {
    newObj[longestKey] = newObj[longestKey].slice(0, -2)
  }

  return newObj
}
export const filterDeviceIDQuote = (did: string): string => {
  return did.replace(/"/g, '')
}
export const shortEmailAddress = (mail: string) => {
  const [user, domain] = mail.split('@')
  return `${user.slice(0, 2)}***${user.slice(-1)}@${domain}`
}

export function effectiveBalance(
  balance: any,
  length: number = 4,
  decimalSubLen: number = 2
) {
  if (isNaN(parseFloat(balance))) {
    return '0.00'
  }
  if (!balance || balance === '0') {
    return 0
  }
  if (balance < 1 / Math.pow(10, 6)) {
    return '0.00'
  }
  balance = new BigNumber(balance.toString()).toFixed()
  if (balance.split('.').length === 1) {
    return balance > 1000
      ? `${Number(balance).toLocaleString()}.00`
      : `${balance}.00`
  }
  const integer = balance.split('.')[0]
  const decimal = balance.split('.')[1]
  if (integer > 0) {
    const str =
      decimal.length === 1 ? `${decimal}0` : decimal.substr(0, decimalSubLen)
    const res = `${integer}.${str}`
    return Number(res) > 1000
      ? `${Number(integer).toLocaleString()}.${str}`
      : res
  }

  const temp: any = []
  let tempNum = 0
  let isNotZero = false
  for (let i = 0; i < decimal.length; i++) {
    if (decimal[i] != '0' && !isNotZero) {
      isNotZero = true
    }
    if (isNotZero) {
      tempNum++
    }
    if (tempNum <= length) {
      temp.push(decimal[i])
    }
  }
  const res = parseFloat(`${integer}.${temp.join('')}`)
  return res > 1000
    ? `${Number(integer).toLocaleString()}.${temp.join('')}`
    : res
}

export const getDollarValue = (balance: string, price: string) => {
  return (Number(balance) * Number(price)).toString()
}

export function remove0x(str: string) {
  if (str.startsWith('0x')) {
    return str.substring(2)
  } else {
    return str
  }
}
