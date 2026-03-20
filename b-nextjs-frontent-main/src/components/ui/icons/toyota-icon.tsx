import Image from 'next/image'
import * as React from 'react'

export type ToyotaIconPropsTypes = {} & Partial<React.ReactPortal>

export const ToyotaIcon = React.memo(function ToyotaIcon() {
  return (
    <Image
      priority
      src="/svg/logo-toyota.svg"
      height={32}
      width={32}
      alt="Логотип компании Toyota"
    />
  )
})

ToyotaIcon.displayName = 'ToyotaIcon'
