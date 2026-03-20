'use client'
import { cn } from '@/lib/utils'
import { ZoomIn } from 'lucide-react'
import Image from 'next/image'
import { ImageData } from './image-viewer'

interface ImageThumbnail extends Pick<ImageData, 'alt' | 'height' | 'width' | 'src' | 'id'> {
  className?: string
}

interface ImageThumbnailProps {
  image: ImageThumbnail
  onClick: (image: ImageThumbnail) => void
  className?: string
  priority?: boolean
  fill?: boolean
}

export const ImageThumbnail: React.FC<ImageThumbnailProps> = ({
  image,
  onClick,
  className = '',
  priority = false,
  fill,
}) => {
  return (
    <div
      className={cn(
        `
          group relative cursor-pointer overflow-hidden rounded-lg shadow-md transition-all
          duration-200
          hover:scale-105 hover:shadow-lg
        `,
        className,
      )}
      onClick={() => onClick(image)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick(image)
        }
      }}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill={fill}
        className={cn('h-48 w-full object-cover', image.className)}
        loading={priority ? 'eager' : 'lazy'}
        width={fill ? undefined : image.width}
        height={fill ? undefined : image.height}
      />
      <div
        className={`
          absolute inset-0 flex items-center justify-center bg-black opacity-0 transition-all
          duration-200
          group-hover:opacity-40
        `}
      >
        <ZoomIn
          className={`
            text-white opacity-0 transition-opacity duration-200
            group-hover:opacity-100
          `}
          size={32}
        />
      </div>
    </div>
  )
}
