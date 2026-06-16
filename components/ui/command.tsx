import * as React from "react"
import { cn } from "@/lib/utils"
import { Search } from "lucide-react"

interface CommandProps {
  children: React.ReactNode
  className?: string
  placeholder?: string
  onSearch?: (value: string) => void
}

function Command({ children, className, placeholder, onSearch }: CommandProps) {
  return (
    <div className={cn("flex flex-col rounded-lg border bg-popover shadow-md", className)}>
      <div className="flex items-center border-b px-3">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <input
          className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={placeholder || "Cari..."}
          onChange={(e) => onSearch?.(e.target.value)}
        />
      </div>
      <div className="max-h-64 overflow-y-auto p-1">{children}</div>
    </div>
  )
}

const CommandItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { onSelect?: () => void }
>(({ className, onSelect, ...props }, ref) => (
  <div
    ref={ref}
    onClick={onSelect}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-md px-3 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground",
      className
    )}
    {...props}
  />
))
CommandItem.displayName = "CommandItem"

const CommandEmpty = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("py-6 text-center text-sm text-muted-foreground", className)} {...props} />
)

export { Command, CommandItem, CommandEmpty }
