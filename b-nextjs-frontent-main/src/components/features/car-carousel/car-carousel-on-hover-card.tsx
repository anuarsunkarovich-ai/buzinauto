'use client'

import { cn } from '@/lib/utils'
import useEmblaCarousel from 'embla-carousel-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { Card } from '../../ui/card'

export type CarCarouselOnHoverCardImagePropsTypes = {
  src: string
  alt: string
}

export type CarCarouselOnHoverCardPropsTypes = {
  images: CarCarouselOnHoverCardImagePropsTypes[]
  rating?: string
  className?: string
  orientation?: 'vertical' | 'horizontal'
  modelSlug: string
  id: string
  brandSlug: string
  countryPath: string
}

export const CarCarouselOnHoverCard: React.FC<
  CarCarouselOnHoverCardPropsTypes & Partial<React.ReactPortal>
> = ({
  images,
  rating,
  className,
  orientation = 'horizontal',
  modelSlug,
  brandSlug,
  id,
  countryPath,
  children,
}) => {
  const router = useRouter()

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    dragFree: false,
    containScroll: 'trimSnaps',
  })
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [isHovering, setIsHovering] = React.useState(false)

  const onSelect = React.useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  React.useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi, onSelect])

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (!isHovering || !emblaApi) return

      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = x / rect.width
      const slideIndex = Math.floor(percentage * images.length)
      const clampedIndex = Math.max(0, Math.min(slideIndex, images.length - 1))

      if (clampedIndex !== selectedIndex) {
        emblaApi.scrollTo(clampedIndex)
      }
    },
    [emblaApi, isHovering, selectedIndex, images.length],
  )

  const handleMouseEnter = React.useCallback(() => {
    setIsHovering(true)
  }, [])

  const handleMouseLeave = React.useCallback(() => {
    setIsHovering(false)
    if (emblaApi) {
      emblaApi.scrollTo(0)
    }
  }, [emblaApi])

  const url = React.useMemo(() => {
    return `${countryPath}/car/${brandSlug}/${modelSlug}/${id}`
  }, [countryPath, brandSlug, modelSlug, id])

  const navigateToCard = React.useCallback(() => {
    return router.push(url)
  }, [router, url])

  return (
    <Card
      className={cn(
        'flex flex-col gap-0 overflow-hidden py-0',
        className,
        orientation === 'horizontal' ? 'md:flex-row md:gap-6' : '',
      )}
    >
      <div
        className={cn(
          'relative w-full cursor-pointer overflow-hidden',
          orientation === 'horizontal' ? `
            md:max-w-1/3
            lg:max-w-1/4
          ` : '',
        )}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="embla w-full" ref={emblaRef}>
          <div className="embla__container flex w-full">
            {images.map((image, index) => (
              <div key={index} className="embla__slide w-full flex-none" onClick={navigateToCard}>
                <div className={`
                  relative h-60 w-full
                  md:h-48
                `}>
                  <Image
                    src={image.src}
                    alt={image.alt}
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    loading={index === 0 ? 'eager' : 'lazy'}
                    fill
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 transform space-x-1">
          {images.map((_, index) => (
            <button
              key={index}
              className={`
                h-2 w-2 rounded-full transition-all duration-200
                ${
                index === selectedIndex ? 'scale-110 bg-white' : `
                  bg-white/60
                  hover:bg-white/80
                `
              }
              `}
              onClick={() => emblaApi?.scrollTo(index)}
            />
          ))}
        </div>

        <div className={`
          absolute top-2 right-2 rounded bg-secondary/90 px-2 py-1 text-xs text-white
          backdrop-blur-sm
        `}>
          {selectedIndex + 1} / {images.length}
        </div>

        {rating && (
          <div className={`
            absolute top-2 left-2 rounded bg-secondary/90 px-2 py-1 text-xs text-white
            backdrop-blur-sm
          `}>
            Оценка {rating}
          </div>
        )}
      </div>
      {children}
    </Card>
  )
}
