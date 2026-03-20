import { cn } from '@/lib/utils'
import * as React from 'react'

export type YandexCardPropsTypes = {
  className?: string
} & Partial<React.ReactPortal>

export const YandexCard: React.FC<YandexCardPropsTypes> = ({ className = 'h-[700px]' }) => {
  return (
    <div className="map-container">
      <iframe
        className={cn('w-full border-0', className)}
        src="https://yandex.ru/map-widget/v1/?um=constructor%3A31c7dae07c929a8603d821f82b17731a3d4c746d1b73cf0eb2dfb7582dd247a0&amp;source=constructor"
        allowFullScreen
      ></iframe>
    </div>
  )
}
