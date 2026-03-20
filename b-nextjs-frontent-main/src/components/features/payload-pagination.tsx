/* eslint-disable @typescript-eslint/no-explicit-any */
import { PaginatedDocs } from 'payload'
import * as React from 'react'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../ui/pagination'

export type PayloadPaginationAutoPropsTypes = {
  path: string
} & Omit<PaginatedDocs<any>, 'docs'> &
  Partial<React.ReactPortal>

const PayloadPaginationAutoComponent: React.FC<PayloadPaginationAutoPropsTypes> = ({
  path,
  hasNextPage,
  hasPrevPage,
  totalPages = 1,
  page = 1,
  prevPage,
}) => {
  const getPageUrl = (pageNum: number) => {
    if (pageNum === 1) return path
    return `${path}/page/${pageNum}`
  }

  const renderPageNumbers = () => {
    const items = []
    const displayRange = 2

    items.push(
      <PaginationItem key={1}>
        <PaginationLink href={getPageUrl(1)} isActive={page === 1}>
          1
        </PaginationLink>
      </PaginationItem>,
    )

    const startPage = Math.max(2, page - displayRange)
    const endPage = Math.min(totalPages - 1, page + displayRange)

    if (startPage > 2) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>,
      )
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink href={getPageUrl(i)} isActive={page === i}>
            {i}
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
          <PaginationLink href={getPageUrl(totalPages)} isActive={page === totalPages}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>,
      )
    }

    return items
  }

  if (totalPages === 1) return <></>

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          {hasPrevPage && prevPage && (
            <PaginationPrevious href={hasPrevPage && prevPage ? getPageUrl(prevPage) : '#'} />
          )}
        </PaginationItem>
        {renderPageNumbers()}
        <PaginationItem>
          {hasNextPage && <PaginationNext href={hasNextPage ? getPageUrl(page + 1) : '#'} />}
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

PayloadPaginationAutoComponent.displayName = 'PayloadPaginationAuto'

export const PayloadPaginationAuto = React.memo(PayloadPaginationAutoComponent)
