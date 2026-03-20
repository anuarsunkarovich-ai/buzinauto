import Image from 'next/image'
import * as React from 'react'

export type NissanIconPropsTypes = {} & Partial<React.ReactPortal>

export const NissanIcon = React.memo(function NissanIcon() {
  return (
    <Image
      priority
      src="/svg/logo-nissan.svg"
      height={32}
      width={32}
      alt="Логотип компании Nissan"
    />
  )
})

NissanIcon.displayName = 'NissanIcon'
