import { cn } from '@/lib/utils'
import { LucideIcon, StarIcon } from 'lucide-react'
import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../card'
import { Separator } from '../separator'
import { Text } from '../text'

export interface TimelineColProps {
  label: string
  isReverse?: boolean
  icon?: LucideIcon
  iconClassName?: string
  title: string
  content: React.ReactNode
  cardClassName?: string
  labelClassName?: string
  iconWrapperClassName?: string
  separatorClassName?: string
  showSeparator?: boolean
  separatorHeight?: string
}

export const TimelineCol = React.memo<TimelineColProps>(
  ({
    label,
    isReverse = false,
    icon: Icon = StarIcon,
    iconClassName,
    title,
    content,
    cardClassName,
    labelClassName,
    iconWrapperClassName,
    separatorClassName,
    showSeparator = true,
    separatorHeight = 'calc(100% - 3rem)',
  }) => {
    const containerClasses = React.useMemo(
      () =>
        cn(
          'flex',
          isReverse
            ? `
              flex-row
              md:flex-row-reverse
            `
            : 'flex-row',
        ),
      [isReverse],
    )

    const labelContainerClasses = React.useMemo(
      () =>
        cn(
          `
            hidden w-1/2 pt-8
            md:flex
          `,
          isReverse
            ? `
              mr-4 justify-end
              md:ml-4 md:justify-start
            `
            : 'mr-4 justify-end',
        ),
      [isReverse],
    )

    const contentContainerClasses = React.useMemo(
      () =>
        cn(
          'md:w-1/2',
          isReverse
            ? `
              ml-4
              md:mr-4
            `
            : 'ml-4',
        ),
      [isReverse],
    )

    const iconWrapperClasses = React.useMemo(
      () =>
        cn(
          'flex max-w-fit items-center justify-center rounded-full bg-primary/20 p-2',
          iconWrapperClassName,
        ),
      [iconWrapperClassName],
    )

    const separatorClasses = React.useMemo(
      () => cn('h-[calc(100% - 4rem)] mt-6', separatorClassName),
      [separatorClassName],
    )

    const labelTextClasses = React.useMemo(
      () => cn('text-muted-foreground', labelClassName),
      [labelClassName],
    )

    const cardClasses = React.useMemo(
      () =>
        cn(
          `
            gap-2
            md:gap-6
          `,
          cardClassName,
        ),
      [cardClassName],
    )

    return (
      <li className={containerClasses}>
        <div className={labelContainerClasses}>
          <Text as="small" className={labelTextClasses}>
            {label}
          </Text>
        </div>

        <div className="flex w-10 flex-col items-center pt-6">
          <div className={iconWrapperClasses}>
            <Icon className={iconClassName} />
          </div>
          {showSeparator && (
            <Separator
              orientation="vertical"
              className={separatorClasses}
              style={{ height: separatorHeight }}
            />
          )}
        </div>

        <div className={contentContainerClasses}>
          <div
            className={`
              flex py-8
              md:hidden
            `}
          >
            <Text as="small" className={labelTextClasses}>
              {label}
            </Text>
          </div>

          <Card className={cardClasses}>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
              {typeof content === 'string' ? <Text>{content}</Text> : content}
            </CardContent>
          </Card>
        </div>
      </li>
    )
  },
)

TimelineCol.displayName = 'TimelineCol'
