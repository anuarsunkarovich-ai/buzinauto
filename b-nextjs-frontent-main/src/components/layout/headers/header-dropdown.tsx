import { Href } from '@/components/ui/href'
import { Separator } from '@/components/ui/separator'
import { Title } from '@/components/ui/title'
import { FC, memo, ReactPortal, RefObject, useLayoutEffect } from 'react'
import { cn } from '../../../lib/utils'

export type HeaderDropdownOptions = { title: string; url: string; group?: string }

export type HeaderDropdownPropsTypes = {
  position?: 'left' | 'right' | 'center'
  dropdowns: HeaderDropdownOptions[]
  isOpen: boolean
  ref: RefObject<HTMLDivElement | null>
  relativeRef: RefObject<HTMLButtonElement | null>
} & Partial<ReactPortal>

export const HeaderDropdownContent: FC<HeaderDropdownPropsTypes> = memo(
  ({ isOpen, dropdowns, ref, relativeRef }) => {
    useLayoutEffect(() => {
      if (!ref.current || !relativeRef.current || !isOpen) return

      const buttonRect = relativeRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const dropdownRect = ref.current.getBoundingClientRect()
      const padding = 16
      const dropdownWidth = dropdownRect.width || 500

      const rightPosition = buttonRect.left + dropdownWidth + padding
      const leftPosition = buttonRect.left - dropdownWidth - padding

      const isRightPosition = rightPosition < viewportWidth
      const isLeftPosition = leftPosition < viewportWidth && leftPosition > 0

      if (isRightPosition) {
        ref.current.style.left = `0px`
      } else if (isLeftPosition) {
        ref.current.style.left = `${Math.round(dropdownWidth * -1 + buttonRect.width)}px`
      } else {
        ref.current.style.left = `${Math.round((dropdownWidth / 2) * -1 + buttonRect.width / 2)}px`
      }
    }, [ref, isOpen, relativeRef])

    const groupingDropdowns = dropdowns.reduce(
      (a, b): Record<string, HeaderDropdownOptions[]> => {
        const group = typeof b.group !== 'string' ? 'default' : b.group

        if (group in a) {
          return {
            ...a,
            [group]: a[group].concat(b),
          }
        }
        return {
          ...a,
          [group]: [b],
        }
      },
      {} as Record<string, HeaderDropdownOptions[]>,
    )

    return (
      <div
        ref={ref}
        className={cn(
          `
            absolute top-10 z-10 w-full min-w-[calc(100vw_-_10rem)] space-y-4 rounded-md bg-popover
            p-2 pr-2.5 transition-all duration-200 ease-in-out
            md:min-w-fit
          `,
          isOpen ? '' : 'hidden',
        )}
      >
        {Object.entries(groupingDropdowns).map(([group, dropdowns]) => {
          return (
            <div className="flex flex-col space-y-3" key={group}>
              <div className="px-2">
                <Title as="span" usingStyleFrom="h3">
                  {group}
                </Title>
              </div>
              <Separator />
              <ul className={`
                grid gap-2
                md:w-[500px] md:grid-cols-3
                lg:w-[600px]
              `}>
                {dropdowns.map((dropdown, i) => (
                  <li key={dropdown.url || i}>
                    <Href
                      data-slot="navigation-menu-link"
                      role="menuitem"
                      className={`
                        flex flex-col gap-1 rounded-sm p-2 text-sm text-accent-foreground
                        transition-all outline-none
                        hover:bg-accent hover:text-accent-foreground
                        focus:bg-accent focus:text-accent-foreground
                        focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1
                        [&_svg:not([class*='size-'])]:size-4
                        [&_svg:not([class*='text-'])]:text-muted-foreground
                      `}
                      href={dropdown.url}
                    >
                      <div className="text-sm font-medium">{dropdown.title}</div>
                    </Href>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    )
  },
)

HeaderDropdownContent.displayName = 'HeaderDropdownContent'
