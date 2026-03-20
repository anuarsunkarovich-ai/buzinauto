'use client'

import Link, { LinkProps } from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'

export type HrefPropsTypes = {
  children?: React.ReactNode | undefined
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> &
  LinkProps

export const Href: React.FC<HrefPropsTypes> = ({ href, children, ...props }) => {
  const currentPath = usePathname()
  const hrefPath = typeof href === 'string' ? href : href.pathname || ''

  if (currentPath === hrefPath) {
    return <a {...props}>{children}</a>
  }

  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  )
}
