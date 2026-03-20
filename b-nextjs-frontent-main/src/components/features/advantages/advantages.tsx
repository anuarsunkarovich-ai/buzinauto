import { ChildIcon, ShieldAltIcon, StarIcon } from '@/components/ui/icons'
import { HandshakeIcon } from 'lucide-react'
import * as React from 'react'
import { AdvantagesCard } from './advantages-card'

export type AdvantagesPropsTypes = {} & Partial<React.ReactPortal>

export const Advantages: React.FC<AdvantagesPropsTypes> = React.memo(() => {
  return (
    <div className={`
      grid grid-cols-2 justify-items-center gap-2
      sm:grid-cols-3
      md:grid-cols-4
    `}>
      <AdvantagesCard
        icon={<ShieldAltIcon className={`
          size-10
          md:size-20
        `} />}
        label="Гарантия"
        description="Гарантия с момента получения автомобиля 30 дней"
      />
      <AdvantagesCard
        icon={<ChildIcon className={`
          size-10
          md:size-20
        `} />}
        label="Удобство"
        description="Отслеживание купленного авто онлайн, быстрые сроки доставки"
      />
      <AdvantagesCard
        icon={<StarIcon className={`
          size-10
          md:size-20
        `} />}
        label="Отзывы"
        description="О нас говорят другие, более +500 довольных клиентов"
      />
      <AdvantagesCard
        icon={<HandshakeIcon className={`
          size-10
          md:size-20
        `} />}
        label="Договор"
        description="Всё прозрачно, работаем только по договору"
      />
    </div>
  )
})

Advantages.displayName = 'Advantages'
