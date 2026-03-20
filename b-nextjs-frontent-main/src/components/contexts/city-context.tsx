/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { CITY_ALL } from '@/constants/city'
import { usePathname } from 'next/navigation'
import React, { createContext, ReactNode, useEffect, useState } from 'react'

export interface City {
  id: string
  slug: string
  alias: string
}

export interface CityContextType {
  currentCity: City | null
  setCurrentCity: (city: City) => void
  clearCurrentCity: () => void
  isLoading: boolean
}

export const CityContext = createContext<CityContextType | undefined>(undefined)

interface CityProviderProps {
  children: ReactNode
}

export const CityProvider: React.FC<CityProviderProps> = ({ children }) => {
  const pathname = usePathname()
  const [currentCity, setCurrentCityState] = useState<City | null>(
    CITY_ALL.find((e) => pathname.includes(e.slug)) || null,
  )
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const savedCity = localStorage.getItem('currentCity')
    if (savedCity) {
      try {
        const parsedCity = JSON.parse(savedCity) as City
        setCurrentCityState(parsedCity)
      } catch {
        localStorage.removeItem('currentCity')
      }
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    const pathCity = CITY_ALL.find((e) => pathname.includes(e.slug))
    if (pathCity) {
      setCurrentCityState(pathCity)
      localStorage.setItem('currentCity', JSON.stringify(pathCity))
    }
  }, [pathname])

  const setCurrentCity = (city: City) => {
    setCurrentCityState(city)
    localStorage.setItem('currentCity', JSON.stringify(city))
  }

  const clearCurrentCity = () => {
    setCurrentCityState(null)
    localStorage.removeItem('currentCity')
  }

  const value: CityContextType = {
    currentCity,
    setCurrentCity,
    clearCurrentCity,
    isLoading,
  }

  return <CityContext.Provider value={value}>{children}</CityContext.Provider>
}
