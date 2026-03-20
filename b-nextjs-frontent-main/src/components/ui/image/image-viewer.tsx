/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { usePinchZoom } from '@/hooks/use-pinch-zoom'
import { useSwipe } from '@/hooks/use-swipe'
import { DialogTitle } from '@radix-ui/react-dialog'
import { ArrowLeft, ArrowRight, X, ZoomIn, ZoomOut } from 'lucide-react'
import Image from 'next/image'
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

// Types
export interface ImageData {
  id: string | number
  src: string
  alt: string
  width?: number
  height?: number
}

interface Position {
  x: number
  y: number
}

interface ImageViewerProps {
  image: ImageData | null
  isOpen: boolean
  onClose: () => void
  showControlImage?: boolean
  handlerNextImage?: () => void
  handlerPrevImage?: () => void
}

// Constants
const MIN_SCALE = 0.5
const MAX_SCALE = 5
const ZOOM_STEP = 0.5
const WHEEL_ZOOM_STEP = 0.1
const INITIAL_POSITION: Position = { x: 0, y: 0 }
const INITIAL_SCALE = 1

// Memoized Component
const ImageViewerComponent: React.FC<ImageViewerProps> = ({
  image,
  isOpen,
  onClose,
  handlerNextImage,
  handlerPrevImage,
  showControlImage = false,
}) => {
  const [scale, setScale] = useState<number>(INITIAL_SCALE)
  const [position, setPosition] = useState<Position>(INITIAL_POSITION)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [dragStart, setDragStart] = useState<Position>(INITIAL_POSITION)
  const [showControls, setShowControls] = useState<boolean>(true)
  const [hideControlsTimeout, setHideControlsTimeout] = useState<NodeJS.Timeout | null>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const imageContainerRef = useRef<HTMLDivElement | null>(null)
  const [dragStartPosition, setDragStartPosition] = useState<Position>(INITIAL_POSITION)
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false)

  const handleSwipeLeft = useCallback(() => {
    if (!isDragging && showControlImage && handlerNextImage) {
      handlerNextImage()
    }
  }, [isDragging, showControlImage, handlerNextImage])

  const handleSwipeRight = useCallback(() => {
    if (!isDragging && showControlImage && handlerPrevImage) {
      handlerPrevImage()
    }
  }, [isDragging, showControlImage, handlerPrevImage])

  const swipeHandlers = useSwipe({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
  })

  // Auto-hide controls on mobile
  const resetControlsTimer = useCallback(() => {
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current)
    }
    setShowControls(true)
    if (window.innerWidth < 768) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
  }, [])

  // Show controls on interaction
  const showControlsOnInteraction = useCallback(() => {
    if (window.innerWidth < 768) {
      resetControlsTimer()
    }
  }, [resetControlsTimer])

  const pinchZoomHandlers = usePinchZoom(scale, {
    minScale: MIN_SCALE,
    maxScale: MAX_SCALE,
    currentPosition: position,
    containerRef: imageContainerRef as React.RefObject<HTMLDivElement>,
    onPinchStart: useCallback(
      (newScale: number, center: Position) => {
        setIsTransitioning(false) // Отключаем анимацию во время жеста
        showControlsOnInteraction()
      },
      [showControlsOnInteraction],
    ),

    onPinchMove: useCallback((newScale: number, center: Position, newPosition: Position) => {
      setScale(newScale)
      setPosition(newPosition)
    }, []),

    onPinchEnd: useCallback((newScale: number, center: Position, newPosition: Position) => {
      setTimeout(() => {
        setIsTransitioning(true)
      }, 50)
    }, []),
  })

  // Reset state when opening new image
  useEffect(() => {
    if (isOpen) {
      setScale(INITIAL_SCALE)
      setPosition(INITIAL_POSITION)
      setIsDragging(false)
      setIsTransitioning(false)
      resetControlsTimer()
    }
  }, [isOpen, image?.id, resetControlsTimer])

  useEffect(() => {
    if (!isOpen && hideControlsTimeout) {
      clearTimeout(hideControlsTimeout)
      setHideControlsTimeout(null)
    }
  }, [isOpen, hideControlsTimeout])

  // Cleanup timeout on unmount or close
  useEffect(() => {
    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current)
        hideControlsTimeoutRef.current = null
      }
    }
  }, [])

  // Memoized event handlers
  const handleClose = useCallback(() => {
    setScale(INITIAL_SCALE)
    setPosition(INITIAL_POSITION)
    setIsTransitioning(false)
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current)
      hideControlsTimeoutRef.current = null
    }
    onClose()
  }, [onClose])

  const zoomIn = useCallback(() => {
    setIsTransitioning(true)
    setScale((prev) => Math.min(prev + ZOOM_STEP, MAX_SCALE))
    showControlsOnInteraction()
  }, [showControlsOnInteraction])

  const zoomOut = useCallback(() => {
    setIsTransitioning(true)
    setScale((prev) => Math.max(prev - ZOOM_STEP, MIN_SCALE))
    showControlsOnInteraction()
  }, [showControlsOnInteraction])

  // Обновить resetZoom:
  const resetZoom = useCallback(() => {
    setIsTransitioning(true)
    setScale(INITIAL_SCALE)
    setPosition(INITIAL_POSITION)
    showControlsOnInteraction()
  }, [showControlsOnInteraction])

  // Optimized drag handlers with requestAnimationFrame
  const handleDragStart = useCallback(
    (clientX: number, clientY: number) => {
      if (scale <= 1) return
      setIsTransitioning(false)
      setIsDragging(true)
      setDragStart({ x: clientX, y: clientY })
      setDragStartPosition(position)
      showControlsOnInteraction()
    },
    [scale, position, showControlsOnInteraction],
  )

  const handleDragMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging || scale <= 1) return
      if (rafRef.current) cancelAnimationFrame(rafRef.current)

      rafRef.current = requestAnimationFrame(() => {
        const sensitivity = Math.max(0.3, 1 / Math.sqrt(scale))
        const deltaX = (clientX - dragStart.x) * sensitivity
        const deltaY = (clientY - dragStart.y) * sensitivity

        setPosition({
          x: dragStartPosition.x + deltaX,
          y: dragStartPosition.y + deltaY,
        })
      })
    },
    [isDragging, scale, dragStart, dragStartPosition],
  )

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  // Mouse event handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault()
      handleDragStart(e.clientX, e.clientY)
      swipeHandlers.onMouseDown(e)
    },
    [swipeHandlers, handleDragStart],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      handleDragMove(e.clientX, e.clientY)
      showControlsOnInteraction()
      swipeHandlers.onMouseMove(e)
    },
    [swipeHandlers, handleDragMove, showControlsOnInteraction],
  )

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<Element, MouseEvent>) => {
      handleDragEnd()
      swipeHandlers.onMouseUp(e)
    },
    [swipeHandlers, handleDragEnd],
  )

  // Touch event handlers
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      pinchZoomHandlers.onTouchStart(e)

      if (e.touches.length === 1) {
        setIsTransitioning(false)
        const touch = e.touches[0]
        swipeHandlers.onTouchStart(e)
        handleDragStart(touch.clientX, touch.clientY)
      }
    },
    [pinchZoomHandlers, swipeHandlers, handleDragStart],
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (e.touches.length === 2) {
        pinchZoomHandlers.onTouchMove(e)
        return
      }

      if (e.touches.length === 1) {
        swipeHandlers.onTouchMove(e)
        const touch = e.touches[0]
        handleDragMove(touch.clientX, touch.clientY)
      }
    },
    [swipeHandlers, handleDragMove, pinchZoomHandlers],
  )

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      const delta = e.deltaY > 0 ? -WHEEL_ZOOM_STEP : WHEEL_ZOOM_STEP
      setScale((prev) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev + delta)))
      showControlsOnInteraction()
    },
    [showControlsOnInteraction],
  )

  const handleTap = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest('button')) {
        return
      }
      if (window.innerWidth < 768 && !showControls) {
        resetControlsTimer()
      }
    },
    [showControls, resetControlsTimer],
  )

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<Element>) => {
      pinchZoomHandlers.onTouchEnd(e)

      if (e.touches.length === 0) {
        setTimeout(() => {
          setIsTransitioning(true)
        }, 50)
      }

      handleDragEnd()
      swipeHandlers.onTouchEnd(e)
    },
    [swipeHandlers, handleDragEnd, pinchZoomHandlers],
  )

  const handleDialogClose = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (e.target === imageContainerRef.current) {
        handleClose()
      }
    },
    [handleClose],
  )

  const handleDoubleClick = useCallback(() => {
    setIsTransitioning(true)
    if (scale === 1) {
      zoomIn()
    } else {
      resetZoom()
    }
  }, [scale, zoomIn, resetZoom])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'Escape':
          handleClose()
          break
        case '+':
        case '=':
          zoomIn()
          break
        case '-':
          zoomOut()
          break
        case '0':
          resetZoom()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose, zoomIn, zoomOut, resetZoom])

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  const imageStyles = useMemo(() => {
    const transformDefault = 'translate(0px, 0px)'
    return {
      transform: `scale(${scale}) ${scale === 1 ? transformDefault : `translate(${position.x}px, ${position.y}px)`}`,
      maxHeight: scale === 1 ? '90vh' : 'none',
      maxWidth: scale === 1 ? '90vw' : 'none',
      willChange: isDragging ? 'transform' : 'auto',
      transition: isTransitioning ? 'transform 0.3s ease-out' : 'none',
    }
  }, [scale, position, isDragging, isTransitioning])

  // Memoized cursor style
  const cursorStyle = useMemo(
    () => (scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'),
    [scale, isDragging],
  )

  if (!image) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        ref={containerRef}
        className="h-full w-full !max-w-none border-none bg-black/95 p-0"
        showCloseButton={false}
        onClick={handleDialogClose}
      >
        <DialogTitle className="hidden" />
        <div
          className={`
            relative flex h-full w-full max-w-screen touch-none items-center justify-center
          `}
        >
          {/* Control Panel - Desktop */}
          <div
            className={`
              absolute top-4 left-1/2 z-10 hidden -translate-x-1/2 transform items-center gap-2
              rounded-lg bg-black/50 p-2 transition-opacity duration-300
              md:flex
              ${showControls ? 'opacity-100' : 'pointer-events-none opacity-0'}
            `}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={zoomOut}
              className={`
                text-white
                hover:bg-white/20
              `}
              disabled={scale <= MIN_SCALE}
              type="button"
            >
              <ZoomOut size={20} />
            </Button>
            <span className="min-w-[60px] px-2 text-center text-sm text-white">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={zoomIn}
              className={`
                text-white
                hover:bg-white/20
              `}
              disabled={scale >= MAX_SCALE}
              type="button"
            >
              <ZoomIn size={20} />
            </Button>
            <div className="mx-1 h-6 w-px bg-white/30" />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className={`
                text-white
                hover:bg-white/20
              `}
              type="button"
            >
              <X size={20} />
            </Button>
          </div>

          {/* Control Panel - Mobile */}
          <div
            className={`
              absolute top-2 right-2 left-2 z-10 flex opacity-100 transition-opacity duration-300
              md:hidden
            `}
          >
            {/* Top row - Close */}
            <div className="flex w-full justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className={`
                  h-12 w-12 rounded-lg bg-black/50 text-white
                  hover:bg-white/20
                `}
                type="button"
              >
                <X size={24} />
              </Button>
            </div>
          </div>

          {/* Mobile Zoom Controls - Bottom */}
          <div
            className={`
              absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 transform items-center gap-2
              rounded-xl bg-black/50 p-2 transition-opacity duration-300
              md:hidden
              ${showControls ? 'opacity-100' : 'pointer-events-none opacity-0'}
            `}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={zoomOut}
              className={`
                h-12 w-12 text-white
                hover:bg-white/20
              `}
              disabled={scale <= MIN_SCALE}
              type="button"
            >
              <ZoomOut size={24} />
            </Button>
            <span className="min-w-[80px] px-3 text-center text-base font-medium text-white">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={zoomIn}
              className={`
                h-12 w-12 text-white
                hover:bg-white/20
              `}
              disabled={scale >= MAX_SCALE}
              type="button"
            >
              <ZoomIn size={24} />
            </Button>
          </div>

          {/* Image */}
          <div
            className="flex h-full w-full touch-none items-center justify-center overflow-hidden"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
            onClick={handleTap}
            ref={imageContainerRef}
            style={{ cursor: cursorStyle }}
          >
            <Image
              ref={imageRef}
              src={image.src}
              alt={image.alt}
              className="max-w-none transition-transform duration-0 select-none"
              style={imageStyles}
              width={image.width}
              height={image.height}
              draggable={false}
              onDoubleClick={handleDoubleClick}
              priority
              quality={100}
            />
          </div>

          {/* Image Info - Desktop */}
          {image.alt && (
            <div
              className={`
                absolute bottom-4 left-1/2 hidden -translate-x-1/2 transform rounded-lg bg-black/50
                px-4 py-2 text-sm text-white
                md:block
              `}
            >
              {image.alt}
            </div>
          )}

          {/* Mobile Tap Hint */}
          <div
            className={`
              pointer-events-none absolute top-1/2 left-1/2 z-0 flex -translate-x-1/2
              -translate-y-1/2 transform transition-opacity duration-300
              md:hidden
              ${!showControls ? 'opacity-60' : 'opacity-0'}
            `}
          >
            <div className="rounded-lg bg-black/30 px-4 py-2 text-center text-sm text-white">
              Нажмите для показа панели управления
            </div>
          </div>

          {/* Hints - Desktop Only */}
          <div
            className={`
              absolute right-4 bottom-4 hidden text-xs text-white/70
              md:block
            `}
          >
            <div>ESC - закрыть</div>
            <div>+/- - масштаб</div>
            <div>0 - сбросить масштаб</div>
          </div>

          {showControlImage && (
            <>
              <div
                className={`
                  absolute top-1/2 right-10 hidden
                  md:block
                `}
              >
                <Button variant="ghost" size="icon" onClick={handlerNextImage}>
                  <ArrowRight size={24} />
                </Button>
              </div>
              <div
                className={`
                  absolute top-1/2 left-10 hidden
                  md:block
                `}
              >
                <Button variant="ghost" size="icon" onClick={handlerPrevImage}>
                  <ArrowLeft size={24} />
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export const ImageViewer = memo(ImageViewerComponent, (prevProps, nextProps) => {
  return (
    prevProps.isOpen === nextProps.isOpen &&
    prevProps.image?.id === nextProps.image?.id &&
    prevProps.onClose === nextProps.onClose
  )
})
