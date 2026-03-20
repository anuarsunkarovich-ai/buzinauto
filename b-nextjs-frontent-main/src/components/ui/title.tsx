import { cn } from '@/lib/utils'
import * as React from 'react'

export type TitlePropsTypes = {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'span'
  usingStyleFrom?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'span'
  className?: string
  id?: string
  children: React.ReactNode
} & Partial<React.ReactPortal>

const styles: Record<string, string> = {
  h1: 'scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance',
  h2: 'scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0',
  h3: 'scroll-m-20 text-2xl font-semibold tracking-tight',
  h4: 'scroll-m-20 text-xl font-semibold tracking-tight',
  h5: 'scroll-m-20 text-lg font-semibold tracking-tight',
}

export const Title = React.memo<TitlePropsTypes>(
  ({ as = 'h1', usingStyleFrom = 'h1', className = '', children, id }) => {
    const Tag = as
    const style = usingStyleFrom ? styles[usingStyleFrom] : (styles[as] ?? '')
    return (
      <Tag className={cn(style, className)} id={id}>
        {children}
      </Tag>
    )
  },
)

Title.displayName = 'Title'
