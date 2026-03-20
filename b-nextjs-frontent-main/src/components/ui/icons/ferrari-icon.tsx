import Image from 'next/image'
import * as React from 'react'

export type FerrariIconPropsTypes = {} & Partial<React.ReactPortal>

export const FerrariIcon = React.memo(function FerrariIcon() {
  return (
    <Image
      priority
      src="/svg/logo-ferrari.svg"
      height={32}
      width={32}
      alt="Логотип компании Ferrari"
    />
  )
})

FerrariIcon.displayName = 'FerrariIcon'
