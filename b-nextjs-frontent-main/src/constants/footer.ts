import { FooterMockData } from '@/components/layout/footer'
import {
  CHINA_BREADCRUMB,
  CHINA_CAR_BEZ_PROBEGA,
  CHINA_CAR_HYBRID,
  CHINA_CAR_JAPAN,
  CHINA_CAR_S_PROBEGOM,
  DELIVERY_BREADCRUMB,
  HOME_CONTACT,
  HOME_PRIVACY,
  JAPAN_CAR_BEZ_PROBEGA,
  JAPAN_CAR_LEVORULJNYE,
  JAPAN_CAR_PRAVORULJNYE,
  JAPAN_CAR_ROOT,
  JAPAN_CAR_S_PROBEGOM,
} from './breadcrumb'

export const FooterData: FooterMockData[] = [
  {
    title: 'Япония',
    links: [
      { text: 'Авто из Японии', link: JAPAN_CAR_ROOT.path },
      { text: 'Авто без пробега из Японии ', link: JAPAN_CAR_BEZ_PROBEGA.path },
      { text: 'Авто с пробегом из Японии ', link: JAPAN_CAR_S_PROBEGOM.path },
      { text: 'Леворульные авто из Японии', link: JAPAN_CAR_LEVORULJNYE.path },
      { text: 'Праворульные авто из Японии', link: JAPAN_CAR_PRAVORULJNYE.path },
    ],
  },
  {
    title: 'Китай',
    links: [
      { text: 'Авто из Китая', link: CHINA_BREADCRUMB.path },
      { text: 'Авто из Китая с пробегом', link: CHINA_CAR_S_PROBEGOM.path },
      { text: 'Гибридные авто из Китая', link: CHINA_CAR_HYBRID.path },
      { text: 'Авто из Китая без пробега', link: CHINA_CAR_BEZ_PROBEGA.path },
      { text: 'Японские авто из Китая', link: CHINA_CAR_JAPAN.path },
    ],
  },
  {
    title: 'Сервисы',
    links: [
      { text: 'Месяц выпуска авто', link: 'https://auc.jptrade.ru/month' },
      { text: 'Отчёт по номеру шасси', link: 'https://auc.jptrade.ru/report' },
      { text: 'Доставка авто', link: DELIVERY_BREADCRUMB.path },
    ],
  },
  {
    title: 'О компании',
    links: [
      { text: 'Контакты', link: HOME_CONTACT.path },
      { text: 'Политика конфиденциальности', link: HOME_PRIVACY.path },
    ],
  },
]
