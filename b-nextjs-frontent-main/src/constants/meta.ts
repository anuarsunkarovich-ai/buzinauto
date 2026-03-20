export const META_DESCRIPTION = {
  ACTION: 'Автоподбор',
  FIRST_END: 'безопасно.',
  DELIVERY: 'Доставка до {city}.',
  END: 'Даём гарантии 🟢 Работаем более 15 лет, полное описание, низкая комиссия. Бесплатная консультация.',
}

export const META_TITLE = {
  START: 'Аукционные авто',
  AUCTION_JAPAN: 'с Японии',
  AUCTION_CHINA: 'с Китая',
  AUCTION: 'с аукциона',
  JAPAN: 'из Японии',
  CHINA: 'из Китая',
  END: '- Buzinavto',
}

export const META_H1 = {
  START: 'Аукционные автомобили',
  AUCTION_JAPAN: 'с Японии',
  AUCTION_CHINA: 'с Китая',
  AUCTION: 'с аукциона',
  JAPAN: 'из Японии',
  CHINA: 'из Китая',
}

const normalizeText = (text: (string | undefined)[]) =>
  text
    .join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim()

export const generateDescription = {
  begin: (text: string, action?: string, end?: string) =>
    normalizeText([
      action || META_DESCRIPTION.ACTION,
      text,
      META_DESCRIPTION.FIRST_END,
      META_DESCRIPTION.END,
      end,
    ]),
  beginCity: (text: string, city: string) =>
    normalizeText([
      META_DESCRIPTION.ACTION,
      text,
      META_DESCRIPTION.FIRST_END,
      META_DESCRIPTION.DELIVERY.replace('{city}', city),
      META_DESCRIPTION.END,
    ]),
}

export const generateTitle = {
  endAuction: (text?: string, start?: string) =>
    normalizeText([start || META_TITLE.START, META_TITLE.AUCTION, text, META_TITLE.END]),
  endAuctionJapan: (text?: string, start?: string) =>
    normalizeText([start || META_TITLE.START, META_TITLE.AUCTION_JAPAN, text, META_TITLE.END]),
  endAuctionChina: (text?: string, start?: string) =>
    normalizeText([start || META_TITLE.START, META_TITLE.AUCTION_CHINA, text, META_TITLE.END]),
  endJapan: (text?: string, start?: string) =>
    normalizeText([start || META_TITLE.START, META_TITLE.JAPAN, text, META_TITLE.END]),
  endChina: (text?: string, start?: string) =>
    normalizeText([start || META_TITLE.START, META_TITLE.CHINA, text, META_TITLE.END]),
  middleAuction: (text?: string, start?: string) =>
    normalizeText([start || META_TITLE.START, text, META_TITLE.AUCTION, META_TITLE.END]),
  middleAuctionJapan: (text?: string, start?: string) =>
    normalizeText([start || META_TITLE.START, text, META_TITLE.AUCTION_JAPAN, META_TITLE.END]),
  middleAuctionChina: (text?: string, start?: string) =>
    normalizeText([start || META_TITLE.START, text, META_TITLE.AUCTION_CHINA, META_TITLE.END]),
  middleJapan: (text?: string, start?: string, end?: string) =>
    normalizeText([start || META_TITLE.START, text, META_TITLE.JAPAN, end, META_TITLE.END]),
  middleChina: (text?: string, start?: string, end?: string) =>
    normalizeText([start || META_TITLE.START, text, META_TITLE.CHINA, end, META_TITLE.END]),
}

export const generateH1 = {
  endAuction: (text?: string, start?: string) =>
    normalizeText([start || META_H1.START, META_H1.AUCTION, text]),
  endAuctionJapan: (text?: string, start?: string) =>
    normalizeText([start || META_H1.START, META_H1.AUCTION_JAPAN, text]),
  endJapan: (text?: string, start?: string) =>
    normalizeText([start || META_H1.START, META_H1.JAPAN, text]),
  endChina: (text?: string, start?: string) =>
    normalizeText([start || META_H1.START, META_H1.CHINA, text]),
  middleAuction: (text?: string, start?: string) =>
    normalizeText([start || META_H1.START, text, META_H1.AUCTION]),
  middleAuctionJapan: (text?: string, start?: string) =>
    normalizeText([start || META_H1.START, text, META_H1.AUCTION_JAPAN]),
  middleAuctionChina: (text?: string, start?: string) =>
    normalizeText([start || META_H1.START, text, META_H1.AUCTION_CHINA]),
  middleJapan: (text?: string, start?: string) =>
    normalizeText([start || META_H1.START, text, META_H1.JAPAN]),
  middleChina: (text?: string, start?: string) =>
    normalizeText([start || META_H1.START, text, META_H1.CHINA]),
}

export const generatePage = {
  end: (page: string | number) => ' - страница ' + page,
}
