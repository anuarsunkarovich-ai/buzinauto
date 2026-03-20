import { CityContext, CityContextType } from '@/components/contexts/city-context'
import { useContext } from 'react'

export const useCity = (): CityContextType => {
  const context = useContext(CityContext)

  if (context === undefined) {
    throw new Error('useCurrentCity должен использоваться внутри CityProvider')
  }

  return context
}
