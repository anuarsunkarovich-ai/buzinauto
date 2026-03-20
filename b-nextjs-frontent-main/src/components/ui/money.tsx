import { toMoney } from '@/lib/transform'
import * as React from 'react'
import { Text } from './text'

export type MoneyPropsTypes = {
  amount: number
}

export const Money: React.FC<MoneyPropsTypes> = ({ amount }) => {
  return <Text as="span">{toMoney(amount)}</Text>
}
