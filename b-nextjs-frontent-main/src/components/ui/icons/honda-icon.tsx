import Image from 'next/image'
import * as React from 'react'

export type HondaIconPropsTypes = {} & Partial<React.ReactPortal>

export const HondaIcon = React.memo(function HondaIcon() {
  return (
    <Image priority src="/svg/logo-honda.svg" height={32} width={32} alt="Логотип компании Honda" />
  )
})

HondaIcon.displayName = 'HondaIcon'
