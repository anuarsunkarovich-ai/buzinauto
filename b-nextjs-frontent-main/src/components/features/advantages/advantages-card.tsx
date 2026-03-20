import { Text } from '@/components/ui/text'
import { Title } from '@/components/ui/title'
import * as React from 'react'

export type AdvantagesCardPropsTypes = {
  icon: React.ReactNode
  label: string
  description: string
} & Partial<React.ReactPortal>

export const AdvantagesCard: React.FC<AdvantagesCardPropsTypes> = React.memo(
  ({ icon: Icon, label, description }) => {
    return (
      <div className="flex max-w-40 flex-col items-center space-y-2 text-center">
        <div className="flex justify-center select-none">{Icon}</div>
        <Title as="h3" usingStyleFrom="h4">
          {label}
        </Title>
        <Text>{description}</Text>
      </div>
    )
  },
)

AdvantagesCard.displayName = 'AdvantagesCard'
