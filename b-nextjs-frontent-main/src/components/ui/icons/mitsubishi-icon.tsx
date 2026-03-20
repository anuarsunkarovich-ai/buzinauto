import Image from 'next/image'
import * as React from 'react'

export type MitsubishiIconPropsTypes = {} & Partial<React.ReactPortal>

export const MitsubishiIcon = React.memo(function MitsubishiIcon() {
  return (
    <Image
      priority
      src="/svg/logo-mitsubishi.svg"
      height={32}
      width={32}
      alt="Логотип компании Mitsubishi"
    />
  )
})

MitsubishiIcon.displayName = 'MitsubishiIcon'
