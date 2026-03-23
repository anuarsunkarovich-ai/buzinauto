import { HeaderItemPropsTypes } from '../components/layout/headers/header-item'
import { CITY_ALL } from './city'

export const HEADER_MENU: HeaderItemPropsTypes[] = [
  {
    label: 'Клиентам',
    dropdowns: [
      {
        title: 'Политика конфиденциальности',
        url: '/politika',
        group: 'Полезные сервисы',
      },
    ],
    position: 'right',
  },
  {
    label: 'О нас',
    dropdowns: [
      {
        title: 'Контакты',
        url: '/contacts',
        group: 'Информация о нас',
      },
      {
        title: 'Частые вопросы',
        url: '/faq',
        group: 'Информация о нас',
      },
      {
        title: 'Доставка',
        url: '/delivery',
        group: 'Информация о нас',
      },
    ],
    position: 'right',
  },
  {
    label: 'Авто с Японии',
    dropdowns: [
      {
        title: 'Каталог',
        url: '/japan/cars',
        group: 'Популярное',
      },
      {
        title: 'Калькулятор',
        url: '/japan/calculator',
        group: 'Популярное',
      },
      {
        title: 'Статистика авто',
        url: '/japan/stats',
        group: 'Популярное',
      },
      {
        title: 'Праворульные',
        url: '/japan/pravoruljnye',
        group: 'Популярное',
      },
      {
        title: 'Леворульные',
        url: '/japan/levoruljnye',
        group: 'Популярное',
      },
      {
        title: 'Под заказ',
        url: '/japan/pod-zakaz',
        group: 'Популярное',
      },
      {
        title: 'С пробегом',
        url: '/japan/s-probegom',
        group: 'Популярное',
      },
      {
        title: 'Без пробега',
        url: '/japan/bez-probega',
        group: 'Популярное',
      },
      ...CITY_ALL.map((city) => ({
        title: city.alias,
        url: `/japan/${city.slug}`,
        group: 'Доставка',
      })),
    ],
    position: 'center',
  },
  {
    label: 'Авто с Китая',
    dropdowns: [
      {
        title: 'Каталог',
        url: '/kitai/cars',
        group: 'Популярное',
      },
      {
        title: 'С пробегом',
        url: '/kitai/s-probegom',
        group: 'Популярное',
      },
      {
        title: 'Без пробега',
        url: '/kitai/bez-probega',
        group: 'Популярное',
      },
      {
        title: 'Новые',
        url: '/kitai/novyi',
        group: 'Популярное',
      },
      {
        title: 'Гибридные',
        url: '/kitai/gibridnye',
        group: 'Популярное',
      },
      {
        title: 'Японские',
        url: '/kitai/yaponii',
        group: 'Популярное',
      },
      ...CITY_ALL.map((city) => ({
        title: city.alias,
        url: `/kitai/${city.slug}`,
        group: 'Доставка',
      })),
    ],
    position: 'left',
  },
]
