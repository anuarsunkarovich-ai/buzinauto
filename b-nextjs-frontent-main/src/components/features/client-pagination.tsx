'use client'

import * as React from 'react'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@/components/ui/pagination'
import { Button } from '@/components/ui/button'

type ClientPaginationProps = {
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
  onPageChange: (page: number) => void
  disabled?: boolean
}

export const ClientPagination: React.FC<ClientPaginationProps> = ({
  page,
  totalPages,
  hasNextPage,
  hasPrevPage,
  onPageChange,
  disabled,
}) => {
  if (totalPages <= 1) {
    return null
  }

  const items: React.ReactNode[] = []
  const displayRange = 2
  const startPage = Math.max(2, page - displayRange)
  const endPage = Math.min(totalPages - 1, page + displayRange)

  const renderPageButton = (targetPage: number) => (
    <PaginationItem key={targetPage}>
      <Button
        type="button"
        variant={page === targetPage ? 'outline' : 'ghost'}
        size="icon"
        disabled={disabled || page === targetPage}
        onClick={() => onPageChange(targetPage)}
      >
        {targetPage}
      </Button>
    </PaginationItem>
  )

  items.push(renderPageButton(1))

  if (startPage > 2) {
    items.push(
      <PaginationItem key="ellipsis-start">
        <PaginationEllipsis />
      </PaginationItem>,
    )
  }

  for (let index = startPage; index <= endPage; index += 1) {
    items.push(renderPageButton(index))
  }

  if (endPage < totalPages - 1) {
    items.push(
      <PaginationItem key="ellipsis-end">
        <PaginationEllipsis />
      </PaginationItem>,
    )
  }

  if (totalPages > 1) {
    items.push(renderPageButton(totalPages))
  }

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <Button
            type="button"
            variant="ghost"
            disabled={disabled || !hasPrevPage}
            onClick={() => onPageChange(page - 1)}
          >
            Назад
          </Button>
        </PaginationItem>
        {items}
        <PaginationItem>
          <Button
            type="button"
            variant="ghost"
            disabled={disabled || !hasNextPage}
            onClick={() => onPageChange(page + 1)}
          >
            Вперед
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
