import { useMemo } from 'react'
import { BigNumber } from 'bignumber.js'
import classNames from 'classnames'
import { effectiveBalance, isEmpty } from '@/utils/helper'

export enum NumberType {
  USD = 'USD',
  PRICE = 'PRICE',
  BALANCE = 'BALANCE'
}

interface IAdaptiveNumber {
  value: string | number
  type: NumberType
  price?: string | number
  className?: string
  subClassName?: string
  balanceIsSub?: boolean
  decimalSubLen?: number
}

const AdaptiveNumber = ({
  value,
  type,
  price,
  className,
  subClassName,
  balanceIsSub,
  decimalSubLen
}: IAdaptiveNumber) => {
  const getMulti0Node = (intNum: string, zeroLen: number, exp: string) => {
    return (
      <span>
        {intNum}.
        <span>
          0<sub className={subClassName}>{zeroLen}</sub>
          {exp}
        </span>
      </span>
    )
  }

  const node = useMemo(() => {
    if (isEmpty(value.toString())) return <span>-</span>
    if (value.toString() === '0')
      return <span>{type === NumberType.USD ? '0.00' : '0'}</span>

    if (
      type === NumberType.USD &&
      new BigNumber(value).lt(new BigNumber(0.005))
    ) {
      return <span>≈0.00</span>
    }

    if (
      type === NumberType.BALANCE &&
      !isEmpty(price?.toString() ?? '') &&
      new BigNumber(value).times(new BigNumber(price)).lt(new BigNumber(0.005))
    ) {
      return <span>0</span>
    }

    const normalBalance = parseFloat(value.toString()).toFixed(15)
    const parts = normalBalance.split('.')

    if (parts.length === 2 && parts[1].length > 1 && Number(parts[1]) > 0) {
      const zerosMatch = parts[1].match(/^0+/)
      if (
        zerosMatch &&
        zerosMatch[0].length > 4 &&
        (type === NumberType.PRICE || balanceIsSub)
      ) {
        const exponent = parseInt(parts[1]).toString().substring(0, 4)
        return getMulti0Node(parts[0], zerosMatch[0].length, exponent)
      } else {
        return (
          <span>
            {effectiveBalance(
              normalBalance,
              type === NumberType.USD ? 2 : 4,
              decimalSubLen
            )}
          </span>
        )
      }
    }

    return (
      <span>
        {effectiveBalance(
          normalBalance,
          type === NumberType.USD ? 2 : 4,
          decimalSubLen
        )}
      </span>
    )
  }, [value, type, price, subClassName])

  return (
    <span className={classNames(className)}>
      {(type === NumberType.USD || type === NumberType.PRICE) && '$'}
      {node}
    </span>
  )
}

export default AdaptiveNumber
