import * as React from "react"
import {
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  PanelLeftClose,
  ShieldCheck,
  UserRound,
} from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { useLocation, useNavigate } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { logout } from "@/Redux/user/userThunks"
import { buildSidebarSections } from "./sidebarSection"

const hasCount = (count) => Number.isFinite(count)
const formatCount = (count) => (count > 999 ? "999+" : count)

const getAdminName = (user) =>
  user?.fullName ||
  user?.name ||
  [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
  user?.email ||
  "System Admin"

const getInitials = (value) =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "SA"

const isItemActive = (pathname, itemPath, siblingPaths = []) => {
  if (pathname === itemPath) return true
  if (itemPath === "/super-admin/dashboard" || !pathname.startsWith(`${itemPath}/`)) return false

  return !siblingPaths.some(
    (path) => path.length > itemPath.length && (pathname === path || pathname.startsWith(`${path}/`))
  )
}

const SuperAdminSidebar = ({
  onSectionChange,
  isCollapsed,
  onToggleCollapse,
  platformStats,
  isMobileOpen,
  onMobileClose,
}) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const authUser = useSelector((state) => state.auth?.user)
  const userProfile = useSelector((state) => state.user?.userProfile)

  const adminUser = userProfile || authUser
  const adminName = getAdminName(adminUser)
  const sidebarCollapsed = isCollapsed && !isMobileOpen
  const sections = React.useMemo(
    () => buildSidebarSections(platformStats),
    [platformStats]
  )

  const activeSectionId = React.useMemo(
    () =>
      sections.find((section) =>
        section.items.some((item) =>
          isItemActive(location.pathname, item.path, section.items.map(({ path }) => path))
        )
      )?.id || "overview",
    [location.pathname, sections]
  )

  const [expandedSections, setExpandedSections] = React.useState({
    overview: true,
  })

  const handleNavigate = (item) => {
    onSectionChange?.(item.id)
    navigate(item.path)
    onMobileClose?.()
  }

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap()
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      navigate("/")
    }
  }

  return (
    <>
    {isMobileOpen && (
      <button
        type="button"
        aria-label="Close navigation"
        onClick={onMobileClose}
        className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
      />
    )}
    <aside
      className={cn(
        "workspace-sidebar-surface fixed inset-y-0 left-0 z-50 flex w-80 border-r border-slate-200 text-slate-950 shadow-xl dark:border-slate-800 dark:text-slate-100 transition-transform duration-200 lg:transition-[width]",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        sidebarCollapsed ? "lg:w-16" : "lg:w-80"
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <div className={cn("border-b border-slate-200 dark:border-slate-800", sidebarCollapsed ? "p-2" : "p-4")}>
          <div className={cn("flex items-center", sidebarCollapsed ? "justify-center" : "justify-between gap-3")}>
            {!sidebarCollapsed && (
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">FlightHub Admin</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">Platform Control Center</p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={isMobileOpen ? onMobileClose : onToggleCollapse}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="h-9 w-9 shrink-0 text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              {sidebarCollapsed ? <Menu className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </Button>
          </div>

          {!sidebarCollapsed && (
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 pt-3">
              <div className="flex min-w-0 items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-slate-500" />
                <span className="truncate text-xs text-slate-500 dark:text-slate-400">Platform administration</span>
              </div>
              <span className="shrink-0 rounded border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300">
                SYSTEM ADMIN
              </span>
            </div>
          )}
        </div>

        <ScrollArea className="min-h-0 flex-1 py-3">
          <nav aria-label="System administration navigation" className="space-y-1 px-2">
            {sections.map((section) => {
              const SectionIcon = section.icon
              const hasActiveItem = section.id === activeSectionId
              const isExpanded = expandedSections[section.id] ?? hasActiveItem
              const siblingPaths = section.items.map(({ path }) => path)

              return (
                <div key={section.id}>
                  <button
                    type="button"
                    onClick={() =>
                      sidebarCollapsed
                        ? handleNavigate(section.items[0])
                        : setExpandedSections((previous) => ({
                            ...previous,
                            [section.id]: !previous[section.id],
                          }))
                    }
                    title={sidebarCollapsed ? section.title : undefined}
                    className={cn(
                      "flex h-10 w-full items-center rounded-md text-sm transition-colors",
                      sidebarCollapsed ? "justify-center px-2" : "justify-between px-3",
                      hasActiveItem
                        ? "bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-white"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <SectionIcon className={cn("h-4 w-4 shrink-0", hasActiveItem && "text-primary")} />
                      {!sidebarCollapsed && <span className="truncate font-medium">{section.title}</span>}
                    </span>
                    {!sidebarCollapsed && (
                      isExpanded
                        ? <ChevronDown className="h-4 w-4 shrink-0" />
                        : <ChevronRight className="h-4 w-4 shrink-0" />
                    )}
                  </button>

                  {!sidebarCollapsed && isExpanded && (
                    <div className="ml-5 mt-1 space-y-1 border-l border-slate-200 dark:border-slate-800 pl-3">
                      {section.items.map((item) => {
                        const ItemIcon = item.icon
                        const isActive = isItemActive(location.pathname, item.path, siblingPaths)

                        return (
                          <button
                            type="button"
                            key={item.id}
                            onClick={() => handleNavigate(item)}
                            className={cn(
                              "flex h-9 w-full items-center gap-3 rounded-md px-3 text-left text-sm transition-colors",
                              isActive
                                ? "bg-primary/10 font-medium text-primary dark:bg-primary/15 dark:text-primary"
                                : "text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
                            )}
                          >
                            <ItemIcon className="h-4 w-4 shrink-0" />
                            <span className="min-w-0 flex-1 truncate">{item.label}</span>
                            {hasCount(item.count) && (
                              <Badge className="h-5 shrink-0 border-0 bg-slate-100 px-1.5 text-[10px] text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-800">
                                {formatCount(item.count)}
                              </Badge>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </ScrollArea>

        <div className={cn("border-t border-slate-200 dark:border-slate-800", sidebarCollapsed ? "p-2" : "p-3")}>
          {!sidebarCollapsed && (
            <button
              type="button"
              onClick={() => navigate("/super-admin/profile")}
              className="mb-2 flex w-full min-w-0 items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary dark:bg-slate-800 dark:text-slate-200">
                {getInitials(adminName)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-950 dark:text-slate-100">{adminName}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {adminUser?.email || "System Administrator"}
                </p>
              </div>
            </button>
          )}

          <button
            type="button"
            onClick={handleLogout}
            title={sidebarCollapsed ? "Sign out" : undefined}
            className={cn(
              "flex h-10 w-full items-center rounded-md text-sm text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-300",
              sidebarCollapsed ? "justify-center" : "gap-3 px-3"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>Sign out</span>}
          </button>

          {sidebarCollapsed && (
            <button
              type="button"
              onClick={() => navigate("/super-admin/profile")}
              title={adminName}
              className="mt-2 flex h-10 w-full items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
            >
              <UserRound className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
    </>
  )
}

export default SuperAdminSidebar
