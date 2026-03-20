import { NextResponse } from 'next/server'

const disabled = () => NextResponse.json({ message: 'Payload API is disabled on this demo deployment.' }, { status: 404 })

export const GET = disabled
export const POST = disabled
export const DELETE = disabled
export const PATCH = disabled
export const PUT = disabled
export const OPTIONS = disabled
