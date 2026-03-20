import Image from 'next/image'
import * as React from 'react'

export type LexusIconPropsTypes = {} & Partial<React.ReactPortal>

export const LexusIcon = React.memo(function LexusIcon() {
  return (
    <Image priority src="/svg/logo-lexus.svg" height={32} width={32} alt="Логотип компании Lexus" />
  )
})

LexusIcon.displayName = 'LexusIcon'
