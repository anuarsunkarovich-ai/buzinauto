import { cn } from '@/lib/utils'
import * as React from 'react'

export type BoxContainerPropsTypes = {
  className?: string
  itemScope?: boolean
  itemType?: string
} & Partial<React.ReactPortal>

export const BoxContainer: React.FC<BoxContainerPropsTypes> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        `
          flex flex-col justify-center space-y-3 px-5
          md:space-y-10 md:px-10
          lg:px-40
        `,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
