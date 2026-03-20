import { Href } from '@/components/ui/href'
import { ChevronDown } from 'lucide-react'
import { FC, useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '../../../lib/utils'
import { Button } from '../../ui/button'
import { HeaderDropdownContent, HeaderDropdownOptions } from './header-dropdown'

type HeaderItemCommonPropsTypes = {
  label: string
}

export type HeaderItemPropsTypes = HeaderItemCommonPropsTypes & {
  position: 'left' | 'right' | 'center'
  dropdowns?: HeaderDropdownOptions[]
  url?: string
} & Partial<React.ReactPortal>

export const HeaderItem: FC<HeaderItemPropsTypes> = ({ label, dropdowns, position, url }) => {
  const [isOpen, setIsOpen] = useState(false)
  const hasDropdown = !!dropdowns?.length
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const onClick = useCallback(() => {
    return setIsOpen((e) => !e)
  }, [setIsOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        triggerRef.current &&
        dropdownRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [isOpen])

  return (
    <li className={`
      relative hidden
      md:block
    `}>
      {hasDropdown ? (
        <Button
          ref={triggerRef}
          variant="ghost"
          size="sm"
          className={`
            flex-row-reverse
            hover:cursor-pointer
          `}
          onClick={onClick}
        >
          <ChevronDown
            className={cn('top-[1px] ml-1 size-3 transition duration-300', isOpen && 'rotate-180')}
          />
          {label}
        </Button>
      ) : (
        <Button asChild variant="ghost" size="sm" className={`
          flex-row-reverse
          hover:cursor-pointer
        `}>
          <Href href={url ?? '#'}>{label}</Href>
        </Button>
      )}
      {hasDropdown && (
        <HeaderDropdownContent
          ref={dropdownRef}
          dropdowns={dropdowns}
          isOpen={isOpen}
          position={position}
          relativeRef={triggerRef}
        />
      )}
    </li>
  )
}
