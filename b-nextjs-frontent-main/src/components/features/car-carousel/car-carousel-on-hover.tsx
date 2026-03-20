import * as React from 'react'
import { CarCarouselOnHoverCard } from './car-carousel-on-hover-card'
import { CarVisibleCard, CarVisibleCardPropsTypes } from './car-visible-card'

export type CarCarouselOnHoverPropsTypes = {
  items: CarVisibleCardPropsTypes[]
  orientation?: 'vertical' | 'horizontal'
} & Partial<React.ReactPortal>

export const CarCarouselOnHover: React.FC<CarCarouselOnHoverPropsTypes> = ({
  orientation,
  items,
}) => {
  return (
    <div className="min-h-auto">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col space-y-6">
          {items.map((item, index) => {
            return (
              <CarCarouselOnHoverCard orientation={orientation} key={`${index}`} {...item}>
                <CarVisibleCard orientation={orientation} {...item} />
              </CarCarouselOnHoverCard>
            )
          })}
        </div>
      </div>
    </div>
  )
}
