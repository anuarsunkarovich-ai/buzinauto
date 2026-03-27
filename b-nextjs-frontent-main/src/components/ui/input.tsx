import * as React from 'react'

import { stringToNumber } from '@/lib/transform'
import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        `
          flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base
          shadow-xs transition-[color,box-shadow] outline-none
          selection:bg-primary selection:text-primary-foreground
          file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium
          file:text-foreground
          placeholder:text-muted-foreground
          disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50
          md:text-sm
          dark:bg-input/30
        `,
        'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
        `
          aria-invalid:border-destructive aria-invalid:ring-destructive/20
          dark:aria-invalid:ring-destructive/40
        `,
        className,
      )}
      {...props}
    />
  )
}

function InputNumber({
  onChange,
  onValue,
  ...props
}: React.ComponentProps<'input'> & {
  onValue?: (value: number | undefined) => void | Promise<void>
}) {
  const inputValueToNumber = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e)

      if (typeof onValue !== 'undefined') {
        const nextValue = e.target.value.trim()
        onValue(nextValue ? stringToNumber(nextValue) : undefined)
      }
    },
    [onChange, onValue],
  )

  return <Input {...props} onChange={inputValueToNumber} />
}

export { Input, InputNumber }
