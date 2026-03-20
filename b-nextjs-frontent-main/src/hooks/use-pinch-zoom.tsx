import { useCallback, useRef } from 'react'

export interface PinchZoomConfig {
  minScale?: number
  maxScale?: number
  currentPosition?: { x: number; y: number }
  containerRef?: React.RefObject<HTMLElement>
  onPinchStart?: (scale: number, center: { x: number; y: number }) => void
  onPinchMove?: (
    scale: number,
    center: { x: number; y: number },
    position: { x: number; y: number },
  ) => void
  onPinchEnd?: (
    scale: number,
    center: { x: number; y: number },
    position: { x: number; y: number },
  ) => void
}

export interface PinchZoomHandlers {
  onTouchStart: (e: React.TouchEvent) => void
  onTouchMove: (e: React.TouchEvent) => void
  onTouchEnd: (e: React.TouchEvent) => void
}

interface TouchData {
  touch1: { x: number; y: number } | null
  touch2: { x: number; y: number } | null
  initialDistance: number
  initialScale: number
  initialCenter: { x: number; y: number }
  initialPosition: { x: number; y: number }
  lastDistance: number
  currentScale: number
  isPinching: boolean
}

const getDistance = (
  touch1: { x: number; y: number },
  touch2: { x: number; y: number },
): number => {
  const dx = touch1.x - touch2.x
  const dy = touch1.y - touch2.y
  return Math.sqrt(dx * dx + dy * dy)
}

const getCenter = (touch1: { x: number; y: number }, touch2: { x: number; y: number }) => ({
  x: (touch1.x + touch2.x) / 2,
  y: (touch1.y + touch2.y) / 2,
})

// Функция для вычисления нового положения изображения при масштабировании от центра жеста
const calculateNewPosition = (
  gestureCenter: { x: number; y: number },
  containerRef: React.RefObject<HTMLElement>,
  oldScale: number,
  newScale: number,
  currentPosition: { x: number; y: number },
): { x: number; y: number } => {
  if (!containerRef.current) return currentPosition

  const containerRect = containerRef.current.getBoundingClientRect()
  const containerCenterX = containerRect.width / 2
  const containerCenterY = containerRect.height / 2

  // Относительные координаты центра жеста от центра контейнера
  const relativeCenterX = gestureCenter.x - containerRect.left - containerCenterX
  const relativeCenterY = gestureCenter.y - containerRect.top - containerCenterY

  // Вычисляем новое смещение для масштабирования относительно центра жеста
  const scaleRatio = newScale / oldScale
  const deltaX = relativeCenterX * (1 - scaleRatio)
  const deltaY = relativeCenterY * (1 - scaleRatio)

  return {
    x: currentPosition.x + deltaX,
    y: currentPosition.y + deltaY,
  }
}

export const usePinchZoom = (
  currentScale: number,
  config: PinchZoomConfig = {},
): PinchZoomHandlers => {
  const {
    minScale = 0.5,
    maxScale = 5,
    currentPosition = { x: 0, y: 0 },
    containerRef,
    onPinchStart,
    onPinchMove,
    onPinchEnd,
  } = config

  const touchData = useRef<TouchData>({
    touch1: null,
    touch2: null,
    initialDistance: 0,
    initialScale: 1,
    initialCenter: { x: 0, y: 0 },
    initialPosition: { x: 0, y: 0 },
    lastDistance: 0,
    currentScale: 1,
    isPinching: false,
  })

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        const touch1 = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        const touch2 = { x: e.touches[1].clientX, y: e.touches[1].clientY }
        const distance = getDistance(touch1, touch2)
        const center = getCenter(touch1, touch2)

        touchData.current = {
          touch1,
          touch2,
          initialDistance: distance,
          lastDistance: distance,
          initialScale: currentScale,
          currentScale: currentScale,
          initialCenter: center,
          initialPosition: currentPosition,
          isPinching: true,
        }

        onPinchStart?.(currentScale, center)
      } else {
        // Сброс данных если касание не двумя пальцами
        touchData.current.isPinching = false
      }
    },
    [currentScale, currentPosition, onPinchStart],
  )

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchData.current.isPinching || e.touches.length !== 2 || !containerRef?.current) {
        return
      }

      e.preventDefault()

      const touch1 = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      const touch2 = { x: e.touches[1].clientX, y: e.touches[1].clientY }
      const currentDistance = getDistance(touch1, touch2)
      const center = getCenter(touch1, touch2)

      // Вычисляем инкрементальное изменение масштаба
      const deltaScale = currentDistance / touchData.current.lastDistance
      const newScale = Math.max(
        minScale,
        Math.min(maxScale, touchData.current.currentScale * deltaScale),
      )

      // Обновляем текущие значения для следующей итерации
      touchData.current.lastDistance = currentDistance
      touchData.current.currentScale = newScale

      // Вычисляем новое положение для масштабирования от центра жеста
      const newPosition = calculateNewPosition(
        touchData.current.initialCenter,
        containerRef,
        currentScale, // используем актуальный масштаб из props
        newScale,
        currentPosition, // используем актуальную позицию из props
      )

      onPinchMove?.(newScale, center, newPosition)
    },
    [minScale, maxScale, containerRef, currentScale, currentPosition, onPinchMove],
  )

  const onTouchEnd = useCallback(() => {
    if (touchData.current.isPinching) {
      // Просто завершаем жест с текущими значениями
      // Не нужно пересчитывать финальные значения
      onPinchEnd?.(touchData.current.currentScale, touchData.current.initialCenter, currentPosition)

      touchData.current.isPinching = false
    }
  }, [currentPosition, onPinchEnd])

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  }
}
