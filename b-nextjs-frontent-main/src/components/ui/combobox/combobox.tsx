/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import * as React from 'react'

type ComboboxOption<T> = T & {
  [key: string]: any
}

interface ComboboxProps<T> {
  options: ComboboxOption<T>[]
  value?: string
  onChange?: (value: string | undefined) => void
  valueKey?: keyof T | string
  labelKey?: keyof T | string
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  defaultOpen?: boolean
  disabled?: boolean
  className?: string
  triggerClassName?: string
  contentClassName?: string
  renderOption?: (option: ComboboxOption<T>) => React.ReactNode
  renderTrigger?: (selectedOption: ComboboxOption<T> | undefined, open: boolean) => React.ReactNode
}

const Combobox = React.memo(
  <T,>({
    options,
    value = '',
    onChange,
    valueKey = 'value',
    labelKey = 'label',
    placeholder = 'Select an option...',
    searchPlaceholder = 'Search...',
    emptyMessage = 'No options found.',
    defaultOpen = false,
    disabled = false,
    className,
    triggerClassName,
    contentClassName,
    renderOption,
    renderTrigger,
  }: ComboboxProps<T>) => {
    const [open, setOpen] = React.useState(defaultOpen)

    const selectedOption = React.useMemo(
      () => options.find((option) => option[valueKey] === value),
      [options, value, valueKey],
    )

    const isViewCloseX = React.useMemo(() => {
      return !!value
    }, [value])

    const setValue = React.useCallback(
      (newValue: string | undefined) => {
        onChange?.(newValue)
      },
      [onChange],
    )

    const handleSelect = React.useCallback(
      (currentLabel: string | undefined) => {
        const currentValue = options.find((option) => option[labelKey] === currentLabel)?.[valueKey]
        const newValue = currentValue === value ? '' : currentValue
        setValue(newValue)
        setOpen(false)
      },
      [options, value, setValue, setOpen, labelKey, valueKey],
    )

    const handlerCloseX = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        if (isViewCloseX) {
          e.preventDefault()
          setValue(undefined)
          setOpen(false)
        }
      },
      [isViewCloseX, setValue, setOpen],
    )

    return (
      <div className={cn('relative', className)}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="flex w-full">
              <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className={cn(
                  `
                    grow-1 justify-between rounded-r-none
                    hover:cursor-pointer
                  `,
                  triggerClassName,
                )}
                disabled={disabled}
              >
                <>{selectedOption ? selectedOption[labelKey] : placeholder}</>
              </Button>
              {renderTrigger ? (
                renderTrigger(selectedOption, open)
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className={`
                    rounded-l-none
                    hover:cursor-pointer
                  `}
                  size="icon"
                  onClick={handlerCloseX}
                >
                  {!isViewCloseX ? (
                    <ChevronsUpDown className="opacity-50" />
                  ) : (
                    <X className="opacity-50" />
                  )}
                </Button>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent className={cn('w-full p-0', contentClassName)} forceMount align="start">
            <Command>
              <CommandInput placeholder={searchPlaceholder} className="h-9" />
              <CommandList>
                <CommandEmpty>{emptyMessage}</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={String(option[labelKey])}
                      value={String(option[labelKey])}
                      onSelect={handleSelect}
                    >
                      {renderOption ? (
                        renderOption(option)
                      ) : (
                        <>
                          {option[labelKey]}
                          <Check
                            className={cn(
                              'ml-auto h-4 w-4',
                              value === option[valueKey] ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                        </>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    )
  },
)

Combobox.displayName = 'Combobox'

export { Combobox, type ComboboxOption, type ComboboxProps }
