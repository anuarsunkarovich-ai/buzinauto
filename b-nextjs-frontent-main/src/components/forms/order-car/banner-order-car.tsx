'use client'

import { DialogOrderCar } from '@/components/features/dialog-order-car'
import { Text } from '@/components/ui/text'
import * as React from 'react'

export const BannerOrderCar: React.FC = () => {
  return (
    <div className={`
      flex flex-col space-y-2 rounded-2xl border-2 border-primary px-5 py-7
      sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:px-10
    `}>
      <div className="flex flex-col">
        <Text>Проконсультируем вас прямо сейчас</Text>
        <div className="flex items-center space-x-2">
          <Text>Мы онлайн</Text>
          <span className="relative flex size-3">
            <span className={`
              absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75
            `}></span>
            <span className="relative inline-flex size-3 rounded-full bg-green-500"></span>
          </span>
        </div>
      </div>
      <DialogOrderCar />
    </div>
  )
}
