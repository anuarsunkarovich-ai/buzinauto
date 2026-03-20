'use client'

import * as React from 'react'
import { Text } from '@/components/ui/text'

export type DataPoint = {
  label: string
  value: number
}

export const SimpleLineChart = ({ data }: { data: DataPoint[] }) => {
  if (!data || data.length === 0) return null

  const width = 800
  const height = 150
  
  const values = data.map(d => d.value)
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  
  // Add some padding to the range so points don't hit the absolute top/bottom edges
  const padding = (max - min) * 0.1 || max * 0.1
  const chartMax = max + padding
  const chartMin = Math.max(0, min - padding)
  const range = chartMax - chartMin || 1

  const getPosition = (index: number, value: number) => {
    const x = data.length > 1 ? (index / (data.length - 1)) * width : width / 2
    const y = height - ((value - chartMin) / range) * height
    return { x, y }
  }

  const points = data.map((d, i) => {
    const { x, y } = getPosition(i, d.value)
    return `${x},${y}`
  }).join(' ')

  const polygonPoints = `0,${height} ${points} ${width},${height}`

  return (
    <div className="w-full h-full min-h-[150px] relative group text-primary">
      <svg 
        viewBox={`-10 -10 ${width + 20} ${height + 20}`} 
        preserveAspectRatio="none" 
        className="w-full h-full overflow-visible"
      >
        <defs>
          <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.4" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0, 0.5, 1].map(scale => {
          const y = scale * height
          return (
            <line
              key={scale}
              x1="0"
              y1={y}
              x2={width}
              y2={y}
              className="stroke-border opacity-50"
              strokeDasharray="4 4"
            />
          )
        })}

        {/* Gradient fill */}
        <polygon
          points={polygonPoints}
          fill="url(#chart-grad)"
        />

        {/* The line */}
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-all duration-300 group-hover:stroke-primary/80"
        />

        {/* Data points */}
        {data.map((d, i) => {
          const { x, y } = getPosition(i, d.value)
          return (
            <g key={i} className="group/point">
              <circle
                cx={x}
                cy={y}
                r="4"
                fill="currentColor"
                className="transition-all duration-300 group-hover/point:r-6 cursor-crosshair"
              >
                <title>{`${d.label}: ${d.value.toLocaleString('ru-RU')} ¥`}</title>
              </circle>
              {/* Optional: Always show min/max labels, or just rely on native tooltip */}
            </g>
          )
        })}
      </svg>

      {/* Axis labels */}
      <div className="absolute top-0 right-0 -mt-6 text-xs text-muted-foreground whitespace-nowrap opacity-60 pointer-events-none">
        {Math.round(chartMax).toLocaleString('ru-RU')} ¥
      </div>
      <div className="absolute bottom-0 right-0 -mb-6 text-xs text-muted-foreground whitespace-nowrap opacity-60 pointer-events-none">
        {Math.round(chartMin).toLocaleString('ru-RU')} ¥
      </div>
      <div className="absolute bottom-0 left-0 -mb-6 text-xs text-muted-foreground whitespace-nowrap opacity-60 pointer-events-none">
        {data[0]?.label || ''}
      </div>
      <div className="absolute bottom-0 right-14 -mb-6 text-xs text-muted-foreground whitespace-nowrap opacity-60 pointer-events-none">
        {data[data.length - 1]?.label || ''}
      </div>
    </div>
  )
}
