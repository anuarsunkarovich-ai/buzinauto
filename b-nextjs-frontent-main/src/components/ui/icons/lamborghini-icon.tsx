import Image from 'next/image'
import * as React from 'react'

export type LamborghiniIconPropsTypes = {} & Partial<React.ReactPortal>

export const LamborghiniIcon = React.memo(function LamborghiniIcon() {
  return (
    <Image
      priority
      src="/svg/logo-lamborghini.svg"
      height={28}
      width={28}
      alt="Логотип компании Lamborghini"
    />
  )
})

LamborghiniIcon.displayName = 'LamborghiniIcon'
