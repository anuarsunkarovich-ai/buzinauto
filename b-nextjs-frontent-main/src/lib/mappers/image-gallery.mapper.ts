import { ImageGalleryViewerItems } from '@/components/ui/image/image-gallery-viewer'
import { AuctionMedia } from '@/payload-types'

type RequiredAuctionMedia = Omit<AuctionMedia, 'alt' | 'height' | 'width' | 'url'> & {
  alt: string
  url: string
  width: number
  height: number
}

const isValidImage = (image: AuctionMedia): image is RequiredAuctionMedia => {
  return ['alt', 'height', 'width', 'url'].every((key) => image[key as keyof AuctionMedia] != null)
}

export class ImageGalleryMapper {
  public static toProps(image: AuctionMedia): ImageGalleryViewerItems | undefined {
    if (!isValidImage(image)) return undefined

    return {
      alt: image.alt,
      height: image.height,
      width: image.width,
      id: image.id,
      src: image.url,
      thumbnail: {
        alt: image.alt,
        height: image.sizes?.thumbnail?.height as number,
        width: image.sizes?.thumbnail?.width as number,
        id: image.id as string,
        src: image.sizes?.thumbnail?.url as string,
      },
    }
  }
}
