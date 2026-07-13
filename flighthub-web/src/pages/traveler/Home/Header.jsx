import * as React from "react"
import {
  BookOpen,
  ChevronDown,
  Compass,
  LogOut,
  Menu,
  Plane,
  Search,
  User,
  X,
} from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { logout } from "@/Redux/user/userThunks"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import SessionCountdownControl from "@/components/auth/SessionCountdownControl"

const getInitials = (name) => {
  if (!name) return "U"
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { isAuthenticated, user: authUser } = useSelector((state) => state.auth)
  const { userProfile } = useSelector((state) => state.user)
  const user = userProfile || authUser
  const avatarSrc = user?.avatarUrl || user?.profilePicture

  const navigationLinks = [
    {
      name: "Search flights",
      href: "/traveler",
      icon: Search,
      current: ["/traveler", "/search"].includes(location.pathname),
    },
    {
      name: "Explore",
      href: "/traveler#destinations",
      icon: Compass,
      current: location.pathname === "/traveler" && location.hash === "#destinations",
    },
    ...(isAuthenticated
      ? [{
          name: "My bookings",
          href: "/bookings",
          icon: BookOpen,
          current: ["/bookings", "/view-ticket", "/ticket"].some((path) => location.pathname.startsWith(path)),
        }]
      : []),
  ]

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap()
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      setIsMobileMenuOpen(false)
      navigate("/")
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/88 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="FlightHub home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/20">
              <Plane className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">FlightHub</span>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border border-border/70 bg-muted/40 p-1 md:flex" aria-label="Traveler navigation">
            {navigationLinks.map(({ name, href, icon: Icon, current }) => (
              <Link
                key={name}
                to={href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "flex h-9 items-center gap-2 rounded-full px-4 text-sm font-semibold text-muted-foreground transition hover:bg-background hover:text-foreground",
                  current && "bg-background text-foreground shadow-sm",
                )}
              >
                <Icon className={cn("h-4 w-4", current && "text-primary")} />
                {name}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {isAuthenticated && user ? (
              <>
                <SessionCountdownControl className="[&>span]:hidden lg:[&>span]:inline" />
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-11 max-w-56 justify-start gap-2 rounded-full px-2 pr-3">
                    <Avatar size="lg">
                      <AvatarImage src={avatarSrc} alt="" />
                      <AvatarFallback className="bg-primary/10 font-semibold text-primary">{getInitials(user.fullName)}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 text-left">
                      <span className="block truncate text-xs text-muted-foreground">Traveler account</span>
                      <span className="block truncate text-sm font-semibold">{user.fullName || "My account"}</span>
                    </span>
                    <ChevronDown className="ml-1 h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" sideOffset={8} className="w-64 rounded-xl p-2">
                  <DropdownMenuLabel className="px-2 py-2">
                    <p className="truncate text-sm font-semibold text-foreground">{user.fullName || "Traveler"}</p>
                    <p className="mt-1 truncate text-xs font-normal text-muted-foreground">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="px-2 py-2">
                    <Link to="/profile"><User className="mr-2 h-4 w-4" />Profile and settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="px-2 py-2">
                    <Link to="/bookings"><BookOpen className="mr-2 h-4 w-4" />My bookings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={handleLogout} className="px-2 py-2">
                    <LogOut className="mr-2 h-4 w-4" />Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild><Link to="/login">Sign in</Link></Button>
                <Button asChild className="rounded-full px-5"><Link to="/register">Create account</Link></Button>
              </>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-label={isMobileMenuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {isMobileMenuOpen && (
          <div className="border-t py-4 md:hidden">
            {isAuthenticated && user && (
              <div className="mb-4 space-y-3 rounded-2xl bg-muted/60 p-3">
                <div className="flex items-center gap-3">
                  <Avatar size="lg">
                    <AvatarImage src={avatarSrc} alt="" />
                    <AvatarFallback className="bg-primary/10 font-semibold text-primary">{getInitials(user.fullName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{user.fullName || "Traveler"}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <SessionCountdownControl className="h-9 w-full justify-center" />
              </div>
            )}

            <nav className="space-y-1" aria-label="Mobile traveler navigation">
              {navigationLinks.map(({ name, href, icon: Icon, current }) => (
                <Link
                  key={name}
                  to={href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition",
                    current ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {name}
                </Link>
              ))}
              {isAuthenticated && (
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition",
                    location.pathname === "/profile" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <User className="h-4 w-4" />Profile and settings
                </Link>
              )}
            </nav>

            <div className="mt-4 grid gap-2 border-t pt-4">
              {isAuthenticated ? (
                <Button variant="outline" onClick={handleLogout} className="h-10 justify-center">
                  <LogOut className="mr-2 h-4 w-4" />Sign out
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" asChild><Link to="/login">Sign in</Link></Button>
                  <Button asChild><Link to="/register">Create account</Link></Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
