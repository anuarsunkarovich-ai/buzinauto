'use client'

import { Button } from '@/components/ui/button'
import { Title } from '@/components/ui/title'
import useEmblaCarousel from 'embla-carousel-react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import * as React from 'react'
import { CarCarouselOnHoverCard } from './car-carousel-on-hover-card'
import { CarVisibleCard, CarVisibleCardPropsTypes } from './car-visible-card'

export type CarCarouselSliderPropsTypes = {
  items: CarVisibleCardPropsTypes[]
  title: string
}

export const CarCarouselSlider: React.FC<CarCarouselSliderPropsTypes> = ({ items, title }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'center',
    slidesToScroll: 1,
    containScroll: 'trimSnaps',
    breakpoints: {
      '(min-width: 768px)': { slidesToScroll: 3 },
      '(min-width: 1024px)': { slidesToScroll: 4 },
    },
    duration: 30,
    dragFree: true,
  })

  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)

  const scrollPrev = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  const onSelect = React.useCallback(() => {
    if (!emblaApi) return
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [emblaApi])

  React.useEffect(() => {
    if (!emblaApi) return

    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)

    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi, onSelect])

  return (
    <div className="min-h-auto">
      <div className="relative mx-auto max-w-7xl space-y-2">
        <div className={`
          flex flex-col justify-between
          md:flex-row
        `}>
          <Title as="h2" usingStyleFrom="h2" className="text-left">
            {title}
          </Title>
          <div className="space-x-2">
            <Button
              className={`
                absolute top-1/2 -left-4 z-10 size-10
                md:static
              `}
              variant="secondary"
              size="icon"
              onClick={scrollPrev}
              disabled={!canScrollPrev}
            >
              <ArrowLeft className="size-6" type="button" size={24} />
            </Button>
            <Button
              className={`
                absolute top-1/2 -right-4 z-10 size-10
                md:static
              `}
              variant="secondary"
              size="icon"
              onClick={scrollNext}
              disabled={!canScrollNext}
            >
              <ArrowRight className="size-6" type="button" size={24} />
            </Button>
          </div>
        </div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {items.map((item, index) => (
              <div
                key={`${index}`}
                className={`
                  min-w-0 flex-[0_0_100%]
                  md:flex-[0_0_50%]
                  lg:flex-[0_0_33.333%]
                  xl:flex-[0_0_25%]
                  [&:not(:first-child)]:pl-4
                `}
              >
                <CarCarouselOnHoverCard orientation={'vertical'} {...item}>
                  <CarVisibleCard orientation={'vertical'} {...item} isDetailed={false} />
                </CarCarouselOnHoverCard>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
