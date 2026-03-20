import Image from 'next/image'
import * as React from 'react'

export type BMWIconPropsTypes = {} & Partial<React.ReactPortal>

export const BMWIcon = React.memo(function BMWIcon() {
  return (
    <Image priority src="/svg/logo-bmw-2.svg" height={32} width={32} alt="Логотип компании BMW" />
  )
})

BMWIcon.displayName = 'BMWIcon'
