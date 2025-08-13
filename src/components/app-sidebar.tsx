"use client"

import * as React from "react"
import {
  IconDashboard,
  IconListDetails,
  IconPackage,
  IconBrandChrome,
} from "@tabler/icons-react"

import { GrTransaction } from "react-icons/gr";
import Link from "next/link";

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Update Stock",
      url: "/stock",
      icon: IconPackage,
    },
    {
      title: "Transactions",
      url: "/transactions",
      icon: GrTransaction,
    },
    {
      title: "Upcoming Feature",
      url: "#",
      icon: IconListDetails,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">
                <IconBrandChrome className="w-6 h-6" />
                <span className="text-base font-semibold">Ayam Geybok Inventory</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
