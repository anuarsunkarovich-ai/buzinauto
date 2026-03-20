import { BoxContainer } from '@/components/common/containers/box-container'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/headers/header'
import { PriceCalculationModule } from '@/components/features/price-calculation/price-calculation-module'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata = {
  title: 'Калькулятор расчёта авто из Японии | BuzinAvto',
  description:
    'Рассчитайте стоимость автомобиля из Японии с учётом пошлин, утильсбора, доставки и брокерских услуг по актуальному курсу JPY/RUB.',
}

export default function JapanCalculatorPage() {
  return (
    <div className="flex flex-col space-y-3 md:space-y-10">
      <Header />
      <BoxContainer>
        {/* Page heading row */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">
            Калькулятор расчёта авто из Японии
          </h1>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href="/japan">К каталогу</Link>
          </Button>
        </div>

        {/* Calculator */}
        <PriceCalculationModule />
      </BoxContainer>
      <Footer />
    </div>
  )
}
