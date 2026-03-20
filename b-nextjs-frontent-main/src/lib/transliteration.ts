// utils/transliteration.ts
const cyrillicToLatin: { [key: string]: string } = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'yo',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ь: '',
  ы: 'y',
  ъ: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
}

const latinToCyrillic: { [key: string]: string } = {
  a: 'а',
  b: 'б',
  v: 'в',
  g: 'г',
  d: 'д',
  e: 'е',
  yo: 'ё',
  zh: 'ж',
  z: 'з',
  i: 'и',
  y: 'й',
  k: 'к',
  l: 'л',
  m: 'м',
  n: 'н',
  o: 'о',
  p: 'п',
  r: 'р',
  s: 'с',
  t: 'т',
  u: 'у',
  h: 'х',
  f: 'ф',
  kh: 'х',
  ts: 'ц',
  ch: 'ч',
  sh: 'ш',
  sch: 'щ',
  yu: 'ю',
  ya: 'я',
}

// Специальные маппинги для автомобильных брендов
const brandMappings: { [key: string]: string[] } = {
  toyota: ['тойота', 'toyota'],
  тойота: ['тойота', 'toyota'],
  honda: ['хонда', 'honda'],
  хонда: ['хонда', 'honda'],
  nissan: ['ниссан', 'nissan'],
  ниссан: ['ниссан', 'nissan'],
  mercedes: ['мерседес', 'mercedes'],
  мерседес: ['мерседес', 'mercedes'],
  bmw: ['бмв', 'bmw'],
  бмв: ['бмв', 'bmw'],
  audi: ['ауди', 'audi'],
  ауди: ['ауди', 'audi'],
  volkswagen: ['фольксваген', 'volkswagen'],
  фольксваген: ['фольксваген', 'volkswagen'],
}

export function transliterateText(text: string): string[] {
  const normalized = text.toLowerCase().trim()

  // Проверяем специальные маппинги брендов
  if (brandMappings[normalized]) {
    return brandMappings[normalized]
  }

  const variants = [normalized]

  // Транслитерация с кириллицы на латиницу
  const latinVariant = normalized
    .split('')
    .map((char) => cyrillicToLatin[char] || char)
    .join('')

  if (latinVariant !== normalized) {
    variants.push(latinVariant)
  }

  // Транслитерация с латиницы на кириллицу (упрощенная)
  let cyrillicVariant = normalized
  Object.entries(latinToCyrillic).forEach(([latin, cyrillic]) => {
    cyrillicVariant = cyrillicVariant.replace(new RegExp(latin, 'g'), cyrillic)
  })

  if (cyrillicVariant !== normalized) {
    variants.push(cyrillicVariant)
  }

  return [...new Set(variants)]
}

export function createSearchRegex(query: string): RegExp[] {
  const variants = transliterateText(query)
  return variants.map((variant) => new RegExp(variant, 'i'))
}
