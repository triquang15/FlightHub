import { Menu } from "lucide-react"

import SessionCountdownControl from "@/components/auth/SessionCountdownControl"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const WorkspaceHeader = ({
  title,
  description,
  badge,
  badgeClassName,
  icon: Icon,
  iconClassName,
  onOpenNavigation,
}) => (
  <header className="sticky top-0 z-30 border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
    <div className="flex min-h-20 items-center gap-3 px-4 py-3 sm:px-6">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={onOpenNavigation}
        aria-label="Open navigation"
        className="shrink-0 lg:hidden"
      >
        <Menu className="h-4 w-4" />
      </Button>

      {Icon && (
        <div className={cn("hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:flex", iconClassName)}>
          <Icon className="h-5 w-5" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            {title}
          </h1>
          {badge && (
            <Badge variant="outline" className={cn("hidden shrink-0 rounded-md sm:inline-flex", badgeClassName)}>
              {badge}
            </Badge>
          )}
        </div>
        <p className="mt-0.5 hidden truncate text-sm text-muted-foreground md:block">
          {description}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <SessionCountdownControl showLabel={false} className="h-9 px-2.5 sm:hidden" />
        <SessionCountdownControl className="hidden h-9 sm:inline-flex" />
        <ThemeToggle className="h-9 w-9" />
      </div>
    </div>
  </header>
)

export default WorkspaceHeader
