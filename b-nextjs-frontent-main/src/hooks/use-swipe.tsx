/* eslint-disable @typescript-eslint/no-unused-vars */
import { useCallback, useRef } from 'react'

export interface SwipeConfig {
  minSwipeDistance?: number
  maxSwipeTime?: number
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onSwipeStart?: () => void
  onSwipeEnd?: () => void
}

export interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void
  onTouchMove: (e: React.TouchEvent) => void
  onTouchEnd: (e: React.TouchEvent) => void
  onMouseDown: (e: React.MouseEvent) => void
  onMouseMove: (e: React.MouseEvent) => void
  onMouseUp: (e: React.MouseEvent) => void
  onMouseLeave: (e: React.MouseEvent) => void
}

export const useSwipe = (config: SwipeConfig = {}): SwipeHandlers => {
  const {
    minSwipeDistance = 50,
    maxSwipeTime = 1000,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onSwipeStart,
    onSwipeEnd,
  } = config

  const touchData = useRef({
    startX: 0,
    startY: 0,
    startTime: 0,
    isMouseDown: false,
    isSwiping: false,
  })

  const handleStart = useCallback(
    (clientX: number, clientY: number) => {
      touchData.current = {
        startX: clientX,
        startY: clientY,
        startTime: Date.now(),
        isMouseDown: true,
        isSwiping: true,
      }
      onSwipeStart?.()
    },
    [onSwipeStart],
  )

  const handleEnd = useCallback(
    (clientX: number, clientY: number) => {
      if (!touchData.current.isSwiping) return

      const { startX, startY, startTime } = touchData.current
      const deltaX = clientX - startX
      const deltaY = clientY - startY
      const deltaTime = Date.now() - startTime

      touchData.current.isMouseDown = false
      touchData.current.isSwiping = false

      // Проверяем, что свайп был достаточно быстрым
      if (deltaTime > maxSwipeTime) {
        onSwipeEnd?.()
        return
      }

      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)

      // Определяем направление свайпа
      if (Math.max(absX, absY) >= minSwipeDistance) {
        if (absX > absY) {
          // Горизонтальный свайп
          if (deltaX > 0) {
            onSwipeRight?.()
          } else {
            onSwipeLeft?.()
          }
        } else {
          // Вертикальный свайп
          if (deltaY > 0) {
            onSwipeDown?.()
          } else {
            onSwipeUp?.()
          }
        }
      }

      onSwipeEnd?.()
    },
    [minSwipeDistance, maxSwipeTime, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onSwipeEnd],
  )

  // Touch handlers
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0]
      handleStart(touch.clientX, touch.clientY)
    },
    [handleStart],
  )

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchData.current.isSwiping) {
      //   e.preventDefault()
    }
  }, [])

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.changedTouches[0]
      handleEnd(touch.clientX, touch.clientY)
    },
    [handleEnd],
  )

  // Mouse handlers
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      handleStart(e.clientX, e.clientY)
    },
    [handleStart],
  )

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (touchData.current.isSwiping) {
      //   e.preventDefault()
    }
  }, [])

  const onMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (touchData.current.isMouseDown) {
        handleEnd(e.clientX, e.clientY)
      }
    },
    [handleEnd],
  )

  const onMouseLeave = useCallback(
    (e: React.MouseEvent) => {
      if (touchData.current.isMouseDown) {
        handleEnd(e.clientX, e.clientY)
      }
    },
    [handleEnd],
  )

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
  }
}
