import type React from "react"
import { TableHead } from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface SimpleTableHeaderProps {
  children: React.ReactNode
  className?: string
}

export function SimpleTableHeader({ children, className }: SimpleTableHeaderProps) {
  return (
    <TableHead className={cn("bg-gray-100 text-gray-700 font-semibold text-sm border-b-2 border-gray-200", className)}>
      {children}
    </TableHead>
  )
}
