import Image, { ImageProps } from 'next/image'
import * as React from 'react'

export type HandshakeIconPropsTypes = Partial<ImageProps>

export const HandshakeIcon = React.memo(function HandshakeIcon(props: HandshakeIconPropsTypes) {
  return (
    <Image
      priority
      src="/svg/icon-handshake.svg"
      height={32}
      width={32}
      alt="Иконка рукопожатия"
      {...props}
    />
  )
})

HandshakeIcon.displayName = 'HandshakeIcon'
