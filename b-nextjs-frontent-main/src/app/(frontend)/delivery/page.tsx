import { BoxContainer } from '@/components/common/containers/box-container'
import { AppBreadcrumb } from '@/components/features/breadcrumb'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/headers/header'
import { Money } from '@/components/ui/money'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Text } from '@/components/ui/text'
import { Title } from '@/components/ui/title'
import { DELIVERY_BREADCRUMB, HOME_BREADCRUMB } from '@/constants/breadcrumb'
import { CITY_ALL, CITY_DELIVERY_CAR } from '@/constants/city'
import { Metadata } from 'next'

export const revalidate = 300

export const metadata: Metadata = {
  description: 'Доставка с аукционов Японии, Китая и Кореи',
  title: 'Доставка с аукционов Японии, Китая и Кореи',
}

export default async function DeliveryPage() {
  return (
    <div className={`
      flex flex-col space-y-3
      md:space-y-10
    `}>
      <Header className="mb-0" />
      <BoxContainer>
        <AppBreadcrumb items={[HOME_BREADCRUMB, DELIVERY_BREADCRUMB]} />
        <Title as="h1">Доставка с аукционов Японии, Китая и Кореи</Title>
      </BoxContainer>
      <BoxContainer>
        <Text className="text-sm">
          Компания Buzinavto специализируется на транспортировке автомобилей с аукционов Японии,
          Китая и Кореи. Мы отдаем предпочтение транспортировке автовозами - это оптимальное решение
          по соотношению скорости и цены. Мы работаем со всеми надежными перевозчиками при условии
          предоставления полного комплекта документации для передачи транспортного средства.
          Доверяйте перевозку только проверенным организациям с официальными гарантиями сохранности
          вашего автомобиля - защитите себя от недобросовестных исполнителей. Ниже представлены
          ориентировочные тарифы на автовозную доставку автомобилей из Владивостока по территории
          России.
        </Text>
      </BoxContainer>
      <BoxContainer>
        <Table>
          <TableCaption>
            Окончательные суммы могут отличаться от заявленных. Для точного расчета оставьте заявку
            на сайте. Консультация бесплатная.
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Город</TableHead>
              <TableHead>Стоимость</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {CITY_ALL.map((city) => {
              const delivery = city.id in CITY_DELIVERY_CAR ? CITY_DELIVERY_CAR[city.id] : undefined
              const price = delivery ? delivery.rub : 0
              if (!price) return
              return (
                <TableRow key={city.id}>
                  <TableCell className="font-medium">{city.alias}</TableCell>
                  <TableCell>
                    <Money amount={price} />
                  </TableCell>
                </TableRow>
              )
            }).filter((e) => !!e)}
          </TableBody>
        </Table>
      </BoxContainer>
      <Footer />
    </div>
  )
}
