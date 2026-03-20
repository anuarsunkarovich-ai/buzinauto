import type { Metadata } from 'next'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{
    segments: string[]
  }>
  searchParams: Promise<{
    [key: string]: string | string[]
  }>
}

export const metadata: Metadata = {
  title: 'Admin Disabled',
}

const NotFound = async (_args: Args) => (
  <main className="mx-auto max-w-2xl p-8">
    <h1 className="text-2xl font-bold">Admin is disabled on this demo deployment.</h1>
    <Link href="/japan" className="mt-6 inline-block underline">
      Go to Japan pages
    </Link>
  </main>
)

export default NotFound
