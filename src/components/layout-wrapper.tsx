"use client"

import { AppSidebar } from "@/components/app-sidebar"

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        {children}
      </div>
    </div>
  )
} 