'use client'

import { Calculator, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Href } from '@/components/ui/href'
import * as React from 'react'

export const NavButtons = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
      <Href href="/japan/calculator" className="w-full">
        <Button className="w-full h-16 text-lg font-bold flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-white shadow-xl transition-all hover:scale-[1.02]">
          <Calculator className="w-6 h-6" />
          Калькулятор пошлины
        </Button>
      </Href>
      <Href href="/japan/stats" className="w-full">
        <Button variant="outline" className="w-full h-16 text-lg font-bold flex items-center justify-center gap-3 border-2 border-primary text-primary hover:bg-primary/10 shadow-xl transition-all hover:scale-[1.02]">
          <BarChart3 className="w-6 h-6" />
          Статистика аукционов
        </Button>
      </Href>
    </div>
  )
}
