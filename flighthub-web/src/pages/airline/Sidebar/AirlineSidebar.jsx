import * as React from "react"
import {
  Building2,
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  PanelLeftClose,
  UserRound,
} from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { useLocation, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { logout } from "@/Redux/user/userThunks"
import { sidebarSections } from "./sideBarSections"

const isItemActive = (pathname, itemPath, siblingPaths = []) => {
  if (pathname === itemPath) return true
  if (itemPath === "/airline/dashboard" || !pathname.startsWith(`${itemPath}/`)) return false

  return !siblingPaths.some(
    (path) => path.length > itemPath.length && (pathname === path || pathname.startsWith(`${path}/`))
  )
}

const getDisplayName = (user) =>
  user?.fullName || user?.name || user?.email || "Airline Owner"

const getInitials = (value) =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "AO"

const statusStyles = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300",
  PENDING: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-300",
  INACTIVE: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300",
  SUSPENDED: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-400/30 dark:bg-orange-400/10 dark:text-orange-300",
  BANNED: "border-red-200 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300",
}

const AirlineSidebar = ({ isCollapsed, onToggleCollapse, isMobileOpen, onMobileClose }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const authUser = useSelector((state) => state.auth?.user)
  const userProfile = useSelector((state) => state.user?.userProfile)
  const currentAirline = useSelector((state) => state.airline?.currentAirline)

  const owner = userProfile || authUser
  const ownerName = getDisplayName(owner)
  const airlineName = currentAirline?.name || "Airline workspace"
  const airlineCode = currentAirline?.iataCode || currentAirline?.icaoCode || "FH"
  const airlineStatus = currentAirline?.status || "INACTIVE"
  const sidebarCollapsed = isCollapsed && !isMobileOpen

  const activeSectionId = React.useMemo(
    () =>
      sidebarSections.find((section) =>
        section.items.some((item) =>
          isItemActive(location.pathname, item.path, section.items.map(({ path }) => path))
        )
      )?.id || "overview",
    [location.pathname]
  )

  const [expandedSections, setExpandedSections] = React.useState({
    overview: true,
  })

  const handleNavigate = (item) => {
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
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-500 text-sm font-bold text-white">
                  {airlineCode}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{airlineName}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">Operations Console</p>
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
                <Building2 className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
                <span className="truncate text-xs text-slate-500 dark:text-slate-400">{airlineCode} workspace</span>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded border px-2 py-0.5 text-[10px] font-semibold",
                  statusStyles[airlineStatus] || statusStyles.INACTIVE
                )}
              >
                {airlineStatus}
              </span>
            </div>
          )}
        </div>

        <ScrollArea className="min-h-0 flex-1 py-3">
          <nav aria-label="Airline operations navigation" className="space-y-1 px-2">
            {sidebarSections.map((section) => {
              const SectionIcon = section.icon
              const hasActiveItem = section.id === activeSectionId
              const isExpanded = expandedSections[section.id] ?? hasActiveItem

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
                      <SectionIcon className={cn("h-4 w-4 shrink-0", hasActiveItem && "text-sky-400")} />
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
                        const isActive = isItemActive(
                          location.pathname,
                          item.path,
                          section.items.map(({ path }) => path)
                        )

                        return (
                          <button
                            type="button"
                            key={item.id}
                            onClick={() => handleNavigate(item)}
                            className={cn(
                              "flex h-9 w-full items-center gap-3 rounded-md px-3 text-left text-sm transition-colors",
                              isActive
                                ? "bg-sky-500/12 font-medium text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"
                                : "text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
                            )}
                          >
                            <ItemIcon className="h-4 w-4 shrink-0" />
                            <span className="truncate">{item.label}</span>
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
              onClick={() => navigate("/airline/profile")}
              className="mb-2 flex w-full min-w-0 items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-sky-100 text-xs font-semibold text-sky-700 dark:bg-slate-800 dark:text-slate-200">
                {getInitials(ownerName)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-950 dark:text-slate-100">{ownerName}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {owner?.email || "Airline Owner"}
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
            {sidebarCollapsed ? <LogOut className="h-4 w-4" /> : (
              <>
                <LogOut className="h-4 w-4 shrink-0" />
                <span>Sign out</span>
              </>
            )}
          </button>

          {sidebarCollapsed && (
            <button
              type="button"
              onClick={() => navigate("/airline/profile")}
              title={ownerName}
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

export default AirlineSidebar
