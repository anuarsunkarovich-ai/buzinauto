import { AppSidebar, AppSidebarData } from '@/components/layout/sidebar/sidebar'
import { HEADER_MENU } from './header-menu'

export const SIDEBAR_DATA: AppSidebar = {
  navMain: [...HEADER_MENU].reverse().map((e) => ({
    title: e.label,
    url: e.url,
    items:
      e.dropdowns?.map(
        (item): AppSidebarData => ({
          title: item.title,
          url: item.url,
          group: item.group,
        }),
      ) || [],
  })),
}
