import * as React from 'react'

export type FullContainerPropsTypes = {} & Partial<React.ReactPortal>

export const FullContainer: React.FC<FullContainerPropsTypes> = ({ children }) => {
  return <div className="flex flex-col justify-center space-y-10 px-4">{children}</div>
}
