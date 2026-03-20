import Image, { ImageProps } from 'next/image'
import * as React from 'react'

export type ChildIconPropsTypes = Partial<ImageProps>

export const ChildIcon = React.memo(function ChildIcon(props: ChildIconPropsTypes) {
  return (
    <Image
      priority
      src="/svg/icon-child.svg"
      height={32}
      width={32}
      alt="Иконка ребенка"
      {...props}
    />
  )
})

ChildIcon.displayName = 'ChildIcon'
