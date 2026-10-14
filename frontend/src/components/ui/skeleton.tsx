import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-warm-shimmer rounded-lg", className)}
      {...props}
    />
  )
}

export { Skeleton }
