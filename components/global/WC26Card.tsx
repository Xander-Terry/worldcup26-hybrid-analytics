import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

type Props = {
  children:  ReactNode
  className?: string
}

export function WC26Card({ children, className }: Props) {
  return (
    <div className={cn("wc26-card mb-4", className)}>
      <div className="wc26-card-inner overflow-visible">
        {children}
      </div>
    </div>
  )
}

