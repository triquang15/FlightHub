import {
  ArrowRight,
  CalendarDays,
  CircleAlert,
  Plane,
  PlaneTakeoff,
  Settings,
} from "lucide-react"
import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const normalizeStatus = (status) => String(status || "UNKNOWN").toUpperCase()

const DashboardOverview = () => {
  const navigate = useNavigate()
  const flights = useSelector((state) => state.flight?.flights) || []
  const currentAirline = useSelector((state) => state.airline?.currentAirline)
  const airlineLoading = useSelector((state) => state.airline?.loading)

  const activeFlights = flights.filter((flight) =>
    ["ACTIVE", "SCHEDULED", "PUBLISHED"].includes(normalizeStatus(flight.status))
  ).length
  const airlineStatus = normalizeStatus(currentAirline?.status)
  const recentFlights = flights.slice(0, 5)

  const metrics = [
    { label: "Configured flights", value: flights.length, icon: Plane },
    { label: "Active or scheduled", value: activeFlights, icon: CalendarDays },
    {
      label: "Airline status",
      value: airlineLoading ? "Loading" : airlineStatus,
      icon: CircleAlert,
    },
  ]

  return (
    <div className="space-y-6">
      {airlineStatus !== "ACTIVE" && !airlineLoading && (
        <div className="flex flex-col gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Airline account is {airlineStatus.toLowerCase()}</p>
              <p className="mt-0.5 text-xs opacity-80">
                Some operational actions may remain unavailable until the platform administrator activates the airline.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/airline/organization-profile")}>
            Review profile
          </Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="mt-1 text-xl font-semibold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Flights</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/airline/flights")}>
              View all <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentFlights.length === 0 ? (
              <div className="rounded-md border border-dashed border-border py-10 text-center">
                <Plane className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">No flights configured</p>
                <p className="mt-1 text-xs text-muted-foreground">Create the first flight after your airline is ready.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentFlights.map((flight) => (
                  <button
                    type="button"
                    key={flight.id}
                    onClick={() => navigate(`/airline/flights/${flight.id}`)}
                    className="flex w-full items-center gap-4 px-1 py-3 text-left hover:bg-muted/40"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                      <Plane className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {flight.flightNumber || flight.code || `Flight ${flight.id}`}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[flight.departureAirportCode, flight.arrivalAirportCode].filter(Boolean).join(" to ") || "Route details pending"}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 rounded-md">
                      {normalizeStatus(flight.status)}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Operational Shortcuts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "Manage fleet", path: "/airline/aircraft", icon: PlaneTakeoff },
              { label: "Manage schedules", path: "/airline/schedules", icon: CalendarDays },
              { label: "Review airline profile", path: "/airline/organization-profile", icon: Settings },
            ].map(({ label, path, icon: Icon }) => (
              <Button
                key={path}
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate(path)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {label}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DashboardOverview
