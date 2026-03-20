'use client'

import { ChevronDown } from 'lucide-react'
import React, { createContext, useContext, useState } from 'react'
import { Button } from './button'

// Типы для компонента
type AccordionValue = string
type AccordionType = 'single' | 'multiple'

interface AccordionContextType {
  openItems: Set<AccordionValue>
  toggleItem: (value: AccordionValue) => void
  type: AccordionType
}

// Context для управления состоянием аккордеона
const AccordionContext = createContext<AccordionContextType>({
  openItems: new Set<AccordionValue>(),
  toggleItem: () => {},
  type: 'single',
})

// Главный компонент Accordion
interface AccordionProps {
  children: React.ReactNode
  type?: AccordionType
  defaultValue?: AccordionValue | AccordionValue[] | null
  className?: string
  itemScope?: boolean
  itemProp?: string
  itemType?: string
}

const Accordion: React.FC<AccordionProps> = ({
  children,
  type = 'single',
  defaultValue = null,
  className = '',
  ...props
}) => {
  const [openItems, setOpenItems] = useState<Set<AccordionValue>>(
    new Set(defaultValue ? (Array.isArray(defaultValue) ? defaultValue : [defaultValue]) : []),
  )

  const toggleItem = (value: AccordionValue) => {
    if (type === 'single') {
      setOpenItems((prev) =>
        prev.has(value) ? new Set<AccordionValue>() : new Set<AccordionValue>([value]),
      )
    } else {
      setOpenItems((prev) => {
        const newSet = new Set(prev)
        if (newSet.has(value)) {
          newSet.delete(value)
        } else {
          newSet.add(value)
        }
        return newSet
      })
    }
  }

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem, type }}>
      <div data-slot="accordion" className={className} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  )
}

// Компонент AccordionItem
interface AccordionItemProps {
  children: React.ReactNode
  value: AccordionValue
  className?: string
  itemScope?: boolean
  itemProp?: string
  itemType?: string
}

const AccordionItem: React.FC<AccordionItemProps> = ({
  children,
  value,
  className = '',
  ...props
}) => {
  return (
    <div className={className} {...props}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<{ value: AccordionValue }>, { value })
          : child,
      )}
    </div>
  )
}

// Компонент AccordionTrigger
interface AccordionTriggerProps {
  children: React.ReactNode
  value?: AccordionValue
  className?: string
}

const AccordionTrigger: React.FC<AccordionTriggerProps> = ({
  children,
  value = '',
  className = '',
  ...props
}) => {
  const { openItems, toggleItem } = useContext(AccordionContext)
  const isOpen = openItems.has(value)

  return (
    <Button
      variant={'link'}
      className={`
        w-full text-sm font-medium
        ${className}
      `}
      onClick={() => toggleItem(value)}
      aria-expanded={isOpen}
      {...props}
    >
      {children}
      <ChevronDown
        className={`
          h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200
          ${
          isOpen ? 'rotate-180' : ''
        }
        `}
      />
    </Button>
  )
}

interface AccordionContentProps {
  children: React.ReactNode
  value?: AccordionValue
  className?: string
  itemScope?: boolean
  itemProp?: string
  itemType?: string
}

const AccordionContent: React.FC<AccordionContentProps> = ({
  children,
  value = '',
  className = '',
  ...props
}) => {
  const { openItems } = useContext(AccordionContext)
  const isOpen = openItems.has(value)

  return (
    <div
      className={`
        overflow-hidden text-sm transition-all duration-200
        ${
        isOpen ? 'opacity-100' : 'max-h-0 opacity-0'
      }
      `}
      {...props}
    >
      <div className={`
        px-3
        ${className}
      `}>{children}</div>
    </div>
  )
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger }
