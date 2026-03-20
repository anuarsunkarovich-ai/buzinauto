'use client'

import { CAR_BRAND_ICON } from '@/constants/auto-make-icon'
import useEmblaCarousel from 'embla-carousel-react'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { Card, CardContent } from '../ui/card'
import { Href } from '../ui/href'
import { Title } from '../ui/title'

export type CarouselBrandProps = {
  className?: string
} & Partial<React.ReactPortal>

export const CarouselBrand: React.FC<CarouselBrandProps> = ({ className }) => {
  const { push } = useRouter()
  const [emblaRef] = useEmblaCarousel({
    align: 'center',
    slidesToScroll: 1,
    dragFree: true,
    duration: 30,
    containScroll: 'trimSnaps',
  })

  return (
    <div className={`
      w-full
      ${className}
    `}>
      <div className="embla overflow-hidden" ref={emblaRef}>
        <div className="embla__container flex space-x-2">
          {CAR_BRAND_ICON.map(({ logo: Logo, label, url }, index) => (
            <div className="embla__slide min-w-fit px-2 select-none" key={index}>
              <Card className="cursor-pointer py-0" onClick={() => push(url)}>
                <CardContent className="flex size-28 flex-col items-center justify-center px-6">
                  <Logo />
                  <Href href={url}>
                    <Title className="mt-4 text-center text-sm font-medium">{label}</Title>
                  </Href>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
