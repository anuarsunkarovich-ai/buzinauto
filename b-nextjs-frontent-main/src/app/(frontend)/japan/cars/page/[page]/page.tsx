import { redirect } from 'next/navigation'

type Params = {
  params: Promise<{ page: string }>
}

export default async function JapanCarsLegacyPage({ params }: Params) {
  const { page } = await params
  const safePage = Math.max(1, parseInt(page, 10) || 1)
  redirect(safePage > 1 ? `/japan/cars?page=${safePage}` : '/japan/cars')
}
