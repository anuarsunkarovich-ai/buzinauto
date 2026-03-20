'use client'

import { cn } from '@/lib/utils'
import useEmblaCarousel from 'embla-carousel-react'
import * as React from 'react'
import { ImageThumbnail } from './image-thumbnail'
import { ImageData, ImageViewer } from './image-viewer'

export type ImageGalleryViewerItems = {
  id: string
  src: string
  thumbnail: Omit<ImageGalleryViewerItems, 'thumbnail'>
  alt: string
  width: number
  height: number
}

export type ImageGalleryViewerPropsTypes = {
  images: ImageGalleryViewerItems[]
  className: string
}

export const ImageGalleryViewer: React.FC<ImageGalleryViewerPropsTypes> = ({
  images,
  className,
}) => {
  const [selectedImage, setSelectedImage] = React.useState<ImageData | null>(null)
  const [isViewerOpen, setIsViewerOpen] = React.useState<boolean>(false)
  const [carouselActiveIndex, setCarouselActiveIndex] = React.useState(0)

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    slidesToScroll: 1,
    containScroll: 'trimSnaps',
    watchSlides: true,
    duration: 30,
    dragFree: true,
  })

  React.useEffect(() => {
    if (emblaApi) {
      const onScroll = () => {
        const currentIndex = emblaApi.selectedScrollSnap()
        setCarouselActiveIndex(currentIndex)
      }

      emblaApi.on('scroll', onScroll)
      onScroll()

      return () => {
        emblaApi.off('scroll', onScroll)
      }
    }
  }, [emblaApi])

  const handleImageClick = React.useCallback((image: ImageData): void => {
    setSelectedImage(image)
    setIsViewerOpen(true)
  }, [])

  const handleCloseViewer = (): void => {
    setIsViewerOpen(false)
    setSelectedImage(null)
  }

  const handlerNextImage = React.useCallback(() => {
    if (!selectedImage) return
    const currentIndex = images.findIndex((e) => e.id === selectedImage.id)
    const nextIndex = currentIndex + 1 >= images.length ? 0 : currentIndex + 1
    setSelectedImage(images[nextIndex])
  }, [images, selectedImage])

  const handlerPrevImage = React.useCallback(() => {
    if (!selectedImage) return
    const currentIndex = images.findIndex((e) => e.id === selectedImage.id)
    const nextIndex = currentIndex - 1 < 0 ? images.length - 1 : currentIndex - 1
    setSelectedImage(images[nextIndex])
  }, [images, selectedImage])

  const firstImage = React.useMemo(() => images?.[0], [images])

  const handleThumbnailClick = React.useCallback(
    (image: ImageData, index: number) => {
      handleImageClick(image)
      if (emblaApi) {
        emblaApi.scrollTo(index)
      }
    },
    [handleImageClick, emblaApi],
  )

  const visibleImages = React.useMemo(() => {
    return images.slice(1)
  }, [images])

  return (
    <div className={cn(className)}>
      <div className="flex flex-col pb-5">
        <link itemProp="image" href={firstImage.src} />
        <ImageThumbnail
          key={firstImage.id}
          image={firstImage}
          fill
          onClick={(image) => handleImageClick(image)}
          priority
          className={`
            h-64 w-full
            lg:h-96
          `}
        />
      </div>

      <div
        className={`
          hidden grid-cols-5 gap-2
          md:grid
        `}
      >
        {visibleImages.map((image, index) => (
          <div
            key={image.id}
            className={cn(`
              relative cursor-pointer transition-all duration-200
              hover:opacity-80
            `)}
          >
            <link itemProp="image" href={image.thumbnail.src} />
            <ImageThumbnail
              image={image.thumbnail}
              onClick={(img) => handleImageClick(img)}
              priority={index < 4}
              fill
              className="h-16 w-full overflow-hidden rounded-md"
            />
          </div>
        ))}
      </div>

      <div
        className={`
          select-none
          md:hidden
        `}
      >
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-2 px-2">
            {visibleImages.map((image, index) => (
              <div
                key={image.id}
                className={cn(
                  'relative h-16 w-16 flex-none cursor-pointer transition-all duration-200',
                  `
                    overflow-hidden rounded-md
                    hover:opacity-80
                  `,
                )}
                onClick={() => handleThumbnailClick(image, index + 1)}
              >
                <ImageThumbnail
                  image={image.thumbnail}
                  onClick={(img) => handleImageClick(img)}
                  priority={index < 4}
                  fill
                  className="h-full w-full rounded-md"
                />
              </div>
            ))}
          </div>
        </div>

        {images.length > 1 && (
          <div className="mt-4 flex justify-center gap-1">
            {visibleImages.map((_, index) => (
              <button
                key={index}
                className={cn(
                  'h-2 w-2 rounded-full transition-all duration-200',
                  carouselActiveIndex === index
                    ? 'bg-primary'
                    : `
                      bg-gray-300
                      hover:bg-gray-400
                    `,
                )}
                onClick={() => {
                  setCarouselActiveIndex(index)
                  if (emblaApi) {
                    emblaApi.scrollTo(index)
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      <ImageViewer
        image={selectedImage}
        isOpen={isViewerOpen}
        onClose={handleCloseViewer}
        showControlImage
        handlerNextImage={handlerNextImage}
        handlerPrevImage={handlerPrevImage}
      />
    </div>
  )
}
