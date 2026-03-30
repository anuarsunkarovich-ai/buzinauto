import * as React from 'react'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

type QueryPaginationProps = {
  path: string
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
  query?: Record<string, string | string[] | undefined>
}

const buildPageUrl = (
  path: string,
  query: QueryPaginationProps['query'],
  page: number,
) => {
  const params = new URLSearchParams()

  Object.entries(query || {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry) {
          params.append(key, entry)
        }
      })
      return
    }

    if (value) {
      params.set(key, value)
    }
  })

  if (page > 1) {
    params.set('page', String(page))
  } else {
    params.delete('page')
  }

  const queryString = params.toString()
  return queryString ? `${path}?${queryString}` : path
}

export const QueryPagination: React.FC<QueryPaginationProps> = ({
  path,
  page,
  totalPages,
  hasNextPage,
  hasPrevPage,
  query,
}) => {
  if (totalPages <= 1) {
    return null
  }

  const items: React.ReactNode[] = []
  const displayRange = 2
  const startPage = Math.max(2, page - displayRange)
  const endPage = Math.min(totalPages - 1, page + displayRange)

  items.push(
    <PaginationItem key={1}>
      <PaginationLink href={buildPageUrl(path, query, 1)} isActive={page === 1}>
        1
      </PaginationLink>
    </PaginationItem>,
  )

  if (startPage > 2) {
    items.push(
      <PaginationItem key="ellipsis-start">
        <PaginationEllipsis />
      </PaginationItem>,
    )
  }

  for (let index = startPage; index <= endPage; index += 1) {
    items.push(
      <PaginationItem key={index}>
        <PaginationLink href={buildPageUrl(path, query, index)} isActive={page === index}>
          {index}
        </PaginationLink>
      </PaginationItem>,
    )
  }

  if (endPage < totalPages - 1) {
    items.push(
      <PaginationItem key="ellipsis-end">
        <PaginationEllipsis />
      </PaginationItem>,
    )
  }

  if (totalPages > 1) {
    items.push(
      <PaginationItem key={totalPages}>
        <PaginationLink href={buildPageUrl(path, query, totalPages)} isActive={page === totalPages}>
          {totalPages}
        </PaginationLink>
      </PaginationItem>,
    )
  }

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          {hasPrevPage && <PaginationPrevious href={buildPageUrl(path, query, page - 1)} />}
        </PaginationItem>
        {items}
        <PaginationItem>
          {hasNextPage && <PaginationNext href={buildPageUrl(path, query, page + 1)} />}
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
