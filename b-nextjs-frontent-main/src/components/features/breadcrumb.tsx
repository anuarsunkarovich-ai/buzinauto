import { cn } from '@/lib/utils'
import * as React from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '../ui/breadcrumb'
import { Href } from '../ui/href'

export type BreadcrumbPropsItem = {
  path: string
  name: string
}

export type BreadcrumbPropsTypes = {
  items: BreadcrumbPropsItem[]
} & Partial<React.ReactPortal>

export const AppBreadcrumb: React.FC<BreadcrumbPropsTypes> = ({ items }) => {
  return (
    <Breadcrumb>
      <BreadcrumbList itemScope itemType="https://schema.org/BreadcrumbList">
        {items.map((item, index, arr) => {
          return (
            <React.Fragment key={index}>
              <BreadcrumbItem
                className={cn(index === arr.length - 1 ? 'cursor-default' : '')}
                itemScope
                itemType={'https://schema.org/ListItem'}
                itemProp={'itemListElement'}
              >
                <BreadcrumbLink asChild>
                  <Href href={item.path} itemProp="item">
                    <span itemProp="name">{item.name}</span>
                  </Href>
                </BreadcrumbLink>
                <meta itemProp="position" content={`${index + 1}`} />
              </BreadcrumbItem>
              {index !== arr.length - 1 && <BreadcrumbSeparator className="flex justify-center" />}
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
