import { NextResponse } from 'next/server'

const disabled = () => NextResponse.json({ message: 'Payload GraphQL is disabled on this demo deployment.' }, { status: 404 })

export const POST = disabled
export const OPTIONS = disabled
