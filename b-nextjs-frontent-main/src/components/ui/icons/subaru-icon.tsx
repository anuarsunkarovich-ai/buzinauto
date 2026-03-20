import Image from 'next/image'
import * as React from 'react'

export type SubaruIconPropsTypes = {} & Partial<React.ReactPortal>

export const SubaruIcon = React.memo(function SubaruIcon() {
  return (
    <Image
      priority
      src="/svg/icon-subaru.svg"
      height={32}
      width={32}
      alt="Логотип компании Subaru"
    />
  )
})

SubaruIcon.displayName = 'SubaruIcon'
