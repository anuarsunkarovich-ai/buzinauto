import { TIMELINE_BUY_AUTO } from '@/constants/timeline-buy-auto'
import * as React from 'react'
import { Timeline } from '../ui/timeline/timeline'
import { TimelineCol } from '../ui/timeline/timeline-col'

export type TimelineBuyAutoPropsTypes = Partial<React.ReactPortal>

export const TimelineBuyAuto: React.FC<TimelineBuyAutoPropsTypes> = () => {
  return (
    <Timeline>
      {TIMELINE_BUY_AUTO.map((auto) => {
        return (
          <TimelineCol
            key={auto.label}
            label={auto.label}
            title={auto.title}
            content={auto.content}
            icon={auto.icon}
            iconClassName="text-primary h-5 w-5 fill-primary"
            cardClassName="shadow-lg"
            isReverse={auto.isReverse}
          />
        )
      })}
    </Timeline>
  )
}
