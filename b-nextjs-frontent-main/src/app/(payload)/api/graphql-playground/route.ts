import { NextResponse } from 'next/server'

export const GET = () =>
  NextResponse.json(
    { message: 'Payload GraphQL playground is disabled on this demo deployment.' },
    { status: 404 },
  )
