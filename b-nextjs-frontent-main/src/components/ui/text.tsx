import { cn } from '@/lib/utils'
import * as React from 'react'

export type TextPropsTypes = Partial<React.ReactPortal> & {
  as?: 'p' | 'small' | 'span'
  usingStyleFrom?: 'p' | 'small' | 'span' | 'none'
  className?: string
  itemScope?: boolean
  itemProp?: string
  itemType?: string
  onClick?: () => void
}

const styles: Record<string, string> = {
  p: 'leading-7',
  small: 'text-sm leading-none font-medium',
  span: 'leading-7',
}

export const Text = React.memo<TextPropsTypes>(
  ({ as = 'p', usingStyleFrom, className = '', children, ...props }) => {
    const Tag = as
    const style = usingStyleFrom ? styles[usingStyleFrom] : (styles[as] ?? '')
    return (
      <Tag className={cn(style, className)} {...props}>
        {children}
      </Tag>
    )
  },
)

Text.displayName = 'Text'
