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
import { Check, ChevronDown, ChevronsUpDown, Loader2, X } from 'lucide-react'
import * as React from 'react'

type ComboboxOption<T> = T & {
  [key: string]: any
}

interface ExtendedComboboxProps<T> {
  options: ComboboxOption<T>[]
  value?: string
  onChange?: (value: string | undefined) => void
  onSearch?: (query: string) => void
  valueKey?: keyof T | string
  labelKey?: keyof T | string
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  loadingMessage?: string
  defaultOpen?: boolean
  disabled?: boolean
  loading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  className?: string
  triggerClassName?: string
  contentClassName?: string
  renderOption?: (option: ComboboxOption<T>) => React.ReactNode
  renderTrigger?: (selectedOption: ComboboxOption<T> | undefined, open: boolean) => React.ReactNode
  searchDebounceMs?: number
  onOpenChange?: (open: boolean) => void
}

const toSearchText = (value: unknown) => String(value ?? '').trim().toLowerCase()

const ExtendedCombobox = React.memo(
  <T,>({
    options,
    value = '',
    onChange,
    onSearch,
    valueKey = 'value',
    labelKey = 'label',
    placeholder = 'Select an option...',
    searchPlaceholder = 'Search...',
    emptyMessage = 'No options found.',
    loadingMessage = 'Loading...',
    defaultOpen = false,
    disabled = false,
    loading = false,
    hasMore = false,
    onLoadMore,
    className,
    triggerClassName,
    contentClassName,
    renderOption,
    renderTrigger,
    searchDebounceMs = 300,
    onOpenChange,
  }: ExtendedComboboxProps<T>) => {
    const [open, setOpen] = React.useState(defaultOpen)
    const [searchValue, setSearchValue] = React.useState('')
    const [isLoadingMore, setIsLoadingMore] = React.useState(false)

    // Refs для отслеживания скролла
    const listRef = React.useRef<HTMLDivElement>(null)
    const loadMoreTriggered = React.useRef(false)

    const selectedOption = React.useMemo(
      () => options.find((option) => option[valueKey] === value),
      [options, value, valueKey],
    )

    const filteredOptions = React.useMemo(() => {
      const normalizedQuery = toSearchText(searchValue)

      if (!normalizedQuery) {
        return options
      }

      return options.filter((option) => {
        const label = toSearchText(option[labelKey])
        const rawValue = toSearchText(option[valueKey])

        return label.includes(normalizedQuery) || rawValue.includes(normalizedQuery)
      })
    }, [labelKey, options, searchValue, valueKey])

    const isViewCloseX = React.useMemo(() => {
      return !!value
    }, [value])

    // Дебаунс для поиска
    React.useEffect(() => {
      if (!onSearch) return

      const timer = setTimeout(() => {
        onSearch(searchValue)
      }, searchDebounceMs)

      return () => clearTimeout(timer)
    }, [searchValue, onSearch, searchDebounceMs])

    // Сброс поискового запроса при закрытии
    React.useEffect(() => {
      if (!open && searchValue) {
        setSearchValue('')
      }
    }, [open, searchValue])

    // Обработка изменения открытия
    const handleOpenChange = React.useCallback(
      (newOpen: boolean) => {
        setOpen(newOpen)
        onOpenChange?.(newOpen)
        loadMoreTriggered.current = false
      },
      [onOpenChange],
    )

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
          setValue('')
          setOpen(false)
        }
      },
      [isViewCloseX, setValue, setOpen],
    )

    // Обработка скролла для загрузки дополнительных данных
    const handleScroll = React.useCallback(
      (e: React.UIEvent<HTMLDivElement>) => {
        if (!hasMore || loading || isLoadingMore || loadMoreTriggered.current) return

        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
        const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50 // 50px до конца

        if (isNearBottom && onLoadMore) {
          loadMoreTriggered.current = true
          setIsLoadingMore(true)
          onLoadMore()
        }
      },
      [hasMore, loading, isLoadingMore, onLoadMore],
    )

    // Сброс состояния загрузки когда новые данные загружены
    React.useEffect(() => {
      if (!loading && isLoadingMore) {
        setIsLoadingMore(false)
        loadMoreTriggered.current = false
      }
    }, [loading, isLoadingMore])

    // Обработка поискового запроса
    const handleSearchValueChange = React.useCallback((search: string) => {
      setSearchValue(search)
      loadMoreTriggered.current = false
    }, [])

    return (
      <div className={cn('relative', className)}>
        <Popover open={open} onOpenChange={handleOpenChange}>
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
                  disabled && 'cursor-not-allowed opacity-50',
                  triggerClassName,
                )}
                disabled={disabled}
              >
                <span className="truncate">
                  {selectedOption ? selectedOption[labelKey] : placeholder}
                </span>
                {loading && open && <Loader2 className="ml-2 h-4 w-4 animate-spin opacity-50" />}
              </Button>
              {renderTrigger ? (
                renderTrigger(selectedOption, open)
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    `
                      rounded-l-none
                      hover:cursor-pointer
                    `,
                    disabled && 'cursor-not-allowed opacity-50',
                  )}
                  size="icon"
                  onClick={handlerCloseX}
                  disabled={disabled}
                >
                  {!isViewCloseX ? (
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  ) : (
                    <X className="h-4 w-4 opacity-50" />
                  )}
                </Button>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent
            className={cn('w-full p-0', contentClassName)}
            forceMount
            align="start"
            style={{ width: 'var(--radix-popover-trigger-width)' }}
          >
            <Command shouldFilter={false}>
              <CommandInput
                placeholder={searchPlaceholder}
                className="h-9"
                value={searchValue}
                onValueChange={handleSearchValueChange}
              />
              <CommandList
                ref={listRef}
                onScroll={handleScroll}
                className="max-h-[300px] overflow-y-auto"
              >
                <CommandEmpty>
                  {loading ? (
                    <div className="flex items-center justify-center py-6 text-sm">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {loadingMessage}
                    </div>
                  ) : (
                    emptyMessage
                  )}
                </CommandEmpty>
                <CommandGroup>
                  {filteredOptions.map((option) => (
                    <CommandItem
                      key={String(option[labelKey])}
                      value={String(option[labelKey])}
                      onSelect={handleSelect}
                      className="cursor-pointer"
                    >
                      {renderOption ? (
                        renderOption(option)
                      ) : (
                        <>
                          <span className="flex-1 truncate">{option[labelKey]}</span>
                          <Check
                            className={cn(
                              'ml-2 h-4 w-4 flex-shrink-0',
                              value === option[valueKey] ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                        </>
                      )}
                    </CommandItem>
                  ))}

                  {/* Индикаторыных */}
                  {hasMore && (isLoadingMore || loading) && (
                    <CommandItem disabled className="justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Загрузка...
                    </CommandItem>
                  )}

                  {hasMore &&
                    !loading &&
                    !isLoadingMore &&
                    onLoadMore &&
                    filteredOptions.length > 0 && (
                    <CommandItem
                      onSelect={() => {
                        if (!loadMoreTriggered.current) {
                          loadMoreTriggered.current = true
                          setIsLoadingMore(true)
                          onLoadMore()
                        }
                      }}
                      className={`
                        cursor-pointer justify-center text-blue-600
                        hover:text-blue-800
                      `}
                    >
                      <ChevronDown className="mr-2 h-4 w-4" />
                      Загрузить ещё
                    </CommandItem>
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    )
  },
)

ExtendedCombobox.displayName = 'ExtendedCombobox'

export { ExtendedCombobox, type ComboboxOption, type ExtendedComboboxProps }
