import { ThemeToggle } from "@/components/theme-toggle"
import { useLocation } from "react-router-dom"

export function GlobalThemeControl() {
  const { pathname } = useLocation()
  const usesWorkspaceHeader =
    pathname.startsWith("/airline") || pathname.startsWith("/super-admin")

  if (usesWorkspaceHeader) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] sm:bottom-6 sm:right-6">
      <ThemeToggle className="h-10 w-10 border-border bg-background/90 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/75" />
    </div>
  )
}
