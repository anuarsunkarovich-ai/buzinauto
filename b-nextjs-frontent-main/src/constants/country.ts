export const Country = {
  JAPAN: 'JAPAN',
  CHINA: 'CHINA',
} as const

export type Country = keyof typeof Country

export const CountryPathname = [
  {
    pathname: '/kitai',
    country: Country.CHINA,
  },
  {
    pathname: '/japan',
    country: Country.JAPAN,
  },
]

export const CountryPathnameDefault = Country.JAPAN

export const Countries = [
  {
    value: Country.JAPAN,
    label: 'Япония',
    genitiveLabel: 'Японии', // Родительский
  },
  {
    value: Country.CHINA,
    label: 'Китай',
    genitiveLabel: 'Китая', // Родительский
  },
]

export const mapToValidCountry = (country: string) => {
  const value = country.toUpperCase()
  if (value === 'KITAI') return Country.CHINA
  return country in Country ? Country[country as Country] : value
}

export const mapToDisplayCountry = (country: string) => {
  const ValidCountry = mapToValidCountry(country)
  const value = Countries.find((e) => e.value === ValidCountry)
  return value
}
