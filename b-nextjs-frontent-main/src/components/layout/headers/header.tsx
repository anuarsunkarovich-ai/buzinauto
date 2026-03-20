'use client'

import { DialogOrderCar } from '@/components/features/dialog-order-car'
import { Href } from '@/components/ui/href'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { HEADER_MENU } from '@/constants/header-menu'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { HeaderItem } from './header-item'

export type HeaderPropsTypes = {
  className?: string
} & Partial<React.ReactPortal>

export const Header: React.FC<HeaderPropsTypes> = ({ className }) => {
  return (
    <div
      className={cn(
        `
          flex w-full items-center justify-between px-5 py-4
          lg:px-9
        `,
        className,
      )}
    >
      <Href href={'/'}>
        <Image src={'/web-app-manifest-512x512.png'} alt="Logo Buzinavto" width={100} height={100} />
      </Href>
      <ul className="flex items-center space-x-4">
        {HEADER_MENU.map((menu, i) => {
          return (
            <HeaderItem
              key={`${i}`}
              dropdowns={menu.dropdowns}
              label={menu.label}
              url={menu.url}
              position={menu.position}
            />
          )
        })}
        <DialogOrderCar />
        <Separator
          orientation="vertical"
          className={`
            h-8 w-1
            md:hidden
          `}
        />
        <SidebarTrigger
          className={`
            -mr-1 ml-auto rotate-180
            md:hidden
          `}
        />
      </ul>
    </div>
  )
}
