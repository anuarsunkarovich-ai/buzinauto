import { redirect } from 'next/navigation'

type Params = {
  params: Promise<{ brand: string; page: number }>
}

export default async function JapanBrandLegacyPage({ params }: Params) {
  const { brand, page } = await params
  const safePage = Math.max(1, Number(page) || 1)
  redirect(safePage > 1 ? `/japan/cars/${brand}?page=${safePage}` : `/japan/cars/${brand}`)
}
