import * as React from 'react'

export type TimelinePropsTypes = Partial<React.ReactPortal>

export const Timeline: React.FC<TimelinePropsTypes> = ({ children }) => {
  return <ul className="space-y-8">{children}</ul>
}
