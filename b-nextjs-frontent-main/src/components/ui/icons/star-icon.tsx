import Image, { ImageProps } from 'next/image'
import * as React from 'react'

export type StarIconPropsTypes = Partial<ImageProps>

export const StarIcon = React.memo(function StarIcon(props: StarIconPropsTypes) {
  return (
    <Image
      priority
      src="/svg/icon-star.svg"
      height={32}
      width={32}
      alt="Иконка старта"
      {...props}
    />
  )
})

StarIcon.displayName = 'StarIcon'
