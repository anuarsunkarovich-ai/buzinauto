import Image from 'next/image'
import * as React from 'react'

export type MercedesBenzIconPropsTypes = {} & Partial<React.ReactPortal>

export const MercedesBenzIcon = React.memo(function MercedesBenzIcon() {
  return (
    <Image
      priority
      src="/svg/logo-mercedes-benz.svg"
      height={32}
      width={32}
      alt="Логотип компании Mercedes Benz"
    />
  )
})

MercedesBenzIcon.displayName = 'MercedesBenzIcon'
