'use client'

import { Button } from '@/components/ui/button'
import { Href } from '@/components/ui/href'
import { Separator } from '@/components/ui/separator'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Text } from '@/components/ui/text'
import { Title } from '@/components/ui/title'
import { SIDEBAR_DATA } from '@/constants/sidebar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@radix-ui/react-collapsible'
import { ChevronRight, XIcon } from 'lucide-react'
import Image from 'next/image'
import * as React from 'react'

export type AppSidebar = {
  navMain: AppSidebarData[]
}

export type AppSidebarData = {
  title: string
  url?: string
  group?: string
  items?: AppSidebarData[]
}

export type AppSidebarPropsTypes = {} & Partial<React.ReactPortal>

export const AppSidebar: React.FC<AppSidebarPropsTypes> = () => {
  const { setOpenMobile } = useSidebar()

  return (
    <Sidebar side="right">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex w-full items-center justify-between space-x-4">
              <Href href="/">
                <div className="flex space-x-2">
                  <Image src={'/icon0.svg'} alt="Logo Buzinavto" width={24} height={24} />
                  <span className="text-base font-semibold">Buzinavto</span>
                </div>
              </Href>
              <Button
                className="size-8 cursor-pointer"
                variant={'secondary'}
                size={'icon'}
                onClick={() => setOpenMobile(false)}
              >
                <XIcon />
              </Button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
        <Separator />
      </SidebarHeader>
      <SidebarContent className="scrollbar-primary gap-0">
        {SIDEBAR_DATA.navMain.map((item) => {
          if (item.url) {
            return (
              <SidebarGroup key={item.title}>
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Href href={item.url} onClick={() => setOpenMobile(false)}>
                      {item.title}
                    </Href>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarGroup>
            )
          }

          const groupingDropdowns = item.items!.reduce(
            (a, b): Record<string, AppSidebarData[]> => {
              const group = typeof b.group !== 'string' ? 'default' : b.group

              if (group in a) {
                return {
                  ...a,
                  [group]: a[group].concat(b),
                }
              }
              return {
                ...a,
                [group]: [b],
              }
            },
            {} as Record<string, AppSidebarData[]>,
          )

          return (
            <Collapsible key={item.title} title={item.title} className="group/collapsible">
              <SidebarGroup>
                <SidebarGroupLabel
                  asChild
                  className={`
                    group/label cursor-pointer text-sm text-sidebar-foreground
                    hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                  `}
                >
                  <CollapsibleTrigger>
                    <Title as="span" usingStyleFrom="h4">
                      {item.title}
                    </Title>
                    <ChevronRight
                      className={`
                        ml-auto transition-transform
                        group-data-[state=open]/collapsible:rotate-90
                      `}
                    />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent className="space-y-2">
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {Object.entries(groupingDropdowns).map(([group, items]) => {
                        return (
                          <div key={item.title + group}>
                            <Text
                              as="small"
                              className="mt-2 block p-2 font-bold text-muted-foreground"
                            >
                              {group}
                            </Text>
                            <Separator />
                            {items.map((item) => {
                              return (
                                <SidebarMenuItem key={item.title}>
                                  <SidebarMenuButton asChild isActive={false}>
                                    <Href href={item.url!} onClick={() => setOpenMobile(false)}>
                                      {item.title}
                                    </Href>
                                  </SidebarMenuButton>
                                </SidebarMenuItem>
                              )
                            })}
                          </div>
                        )
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          )
        })}
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}
