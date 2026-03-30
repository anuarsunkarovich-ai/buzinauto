import { redirect } from 'next/navigation'

type Params = {
  params: Promise<{ brand: string; model: string; page: string }>
}

export default async function JapanModelLegacyPage({ params }: Params) {
  const { brand, model, page } = await params
  const safePage = Math.max(1, parseInt(page, 10) || 1)
  redirect(
    safePage > 1
      ? `/japan/cars/${brand}/${model}?page=${safePage}`
      : `/japan/cars/${brand}/${model}`,
  )
}
