import Image, { ImageProps } from 'next/image'
import * as React from 'react'

export type ShieldAltIconPropsTypes = Partial<ImageProps>

export const ShieldAltIcon = React.memo(function ShieldAltIcon(props: ShieldAltIconPropsTypes) {
  return (
    <Image
      priority
      src="/svg/icon-shield-alt.svg"
      height={32}
      width={32}
      alt="Иконка щита"
      {...props}
    />
  )
})

ShieldAltIcon.displayName = 'ShieldAltIcon'
