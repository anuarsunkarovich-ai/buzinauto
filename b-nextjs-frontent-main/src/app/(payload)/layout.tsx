import React from 'react'

export const dynamic = 'force-dynamic'

type Args = {
  children: React.ReactNode
}

const Layout = ({ children }: Args) => <>{children}</>

export default Layout
