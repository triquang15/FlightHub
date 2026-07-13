import React, { useState } from "react"
import {
  Armchair,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  Info,
  Mail,
  MapPin,
  Phone,
  Plane,
  Receipt,
  Shield,
  Ticket,
  User,
  Users,
  Utensils,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const formatDate = (value) => {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

const formatTime = (value) => {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

const formatMoney = (amount, currency = "USD") =>
  `${currency || "USD"} ${Number(amount || 0).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })}`

const getPassengerName = (passenger) =>
  passenger?.fullName ||
  [passenger?.firstName, passenger?.lastName].filter(Boolean).join(" ") ||
  "Passenger"

const InfoTile = ({ icon: Icon, label, value, detail }) => (
  <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </div>
    <p className="mt-1 break-words text-sm font-semibold text-foreground">{value || "-"}</p>
    {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
  </div>
)

const SectionCard = ({ icon: Icon, title, children, className }) => (
  <Card className={cn("overflow-hidden border-border/70 bg-card/90 shadow-sm", className)}>
    <CardHeader className="border-b border-border/70 px-4 py-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="p-4">{children}</CardContent>
  </Card>
)

const BookingDetails = ({ booking, onClose, getStatusBadge, getPaymentStatusBadge }) => {
  const [expandedAncillary, setExpandedAncillary] = useState(null)
  const currency = booking.currency || booking.ancillaries?.[0]?.currency || "USD"
  const passengers = Array.isArray(booking.passengers) ? booking.passengers : []
  const seats = Array.isArray(booking.seatInstances) ? booking.seatInstances : []
  const meals = Array.isArray(booking.meals) ? booking.meals : []
  const ancillaries = Array.isArray(booking.ancillaries) ? booking.ancillaries : []
  const tickets = Array.isArray(booking.tickets) ? booking.tickets : []

  const toggleAncillary = (id) => {
    setExpandedAncillary((previous) => (previous === id ? null : id))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border/80 bg-background shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-border/70 bg-background/95 px-5 py-4 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  Booking Details
                </h2>
                {getStatusBadge(booking.status)}
                {getPaymentStatusBadge(booking.paymentStatus)}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Reference <span className="font-semibold text-foreground">{booking.bookingReference || "-"}</span>
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0" aria-label="Close booking details">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto p-5">
          <div className="grid gap-4 md:grid-cols-4">
            <InfoTile icon={Receipt} label="Total amount" value={formatMoney(booking.totalAmount, currency)} />
            <InfoTile icon={Plane} label="Flight" value={booking.flightNumber || booking.flightName} detail={booking.flightName} />
            <InfoTile icon={Users} label="Passengers" value={booking.totalPassengers || passengers.length || 0} />
            <InfoTile icon={Calendar} label="Booked" value={formatDate(booking.bookingDate)} detail={formatTime(booking.bookingDate)} />
          </div>

          {(booking.userName || booking.userEmail || booking.contactInfo) && (
            <SectionCard icon={User} title="Customer & Contact" className="mt-4">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <InfoTile label="Booked by" value={booking.userName || "-"} detail={booking.userEmail} />
                <InfoTile icon={Mail} label="Email" value={booking.contactInfo?.email || booking.email || booking.userEmail} />
                <InfoTile icon={Phone} label="Phone" value={booking.contactInfo?.phone || booking.phone} />
                <InfoTile label="Trip type" value={booking.tripType || "One way"} detail={booking.cabinClass || booking.fareName} />
              </div>
            </SectionCard>
          )}

          <SectionCard icon={Plane} title="Flight Information" className="mt-4">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
              <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  Departure
                </p>
                <p className="mt-3 text-2xl font-semibold text-foreground">{formatTime(booking.departureTime)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{formatDate(booking.departureTime)}</p>
                <p className="mt-4 text-base font-semibold text-foreground">{booking.departureAirport || "-"}</p>
              </div>

              <div className="flex items-center justify-center rounded-xl border border-border/70 bg-muted/20 px-5 py-4 text-center">
                <div>
                  <Clock className="mx-auto h-5 w-5 text-primary" />
                  <p className="mt-2 text-sm font-semibold text-foreground">{booking.flightDuration || "Direct"}</p>
                  <p className="text-xs text-muted-foreground">{booking.flightNumber || "Flight"}</p>
                </div>
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  Arrival
                </p>
                <p className="mt-3 text-2xl font-semibold text-foreground">{formatTime(booking.arrivalTime)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{formatDate(booking.arrivalTime)}</p>
                <p className="mt-4 text-base font-semibold text-foreground">{booking.arrivalAirport || "-"}</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={Users} title={`Passengers (${passengers.length || booking.totalPassengers || 0})`} className="mt-4">
            {passengers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No passenger details were returned for this booking.</p>
            ) : (
              <div className="space-y-3">
                {passengers.map((passenger, index) => {
                  const seat = seats[index]
                  return (
                    <div key={passenger.id || index} className="rounded-xl border border-border/70 bg-muted/20 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-base font-semibold text-foreground">{getPassengerName(passenger)}</p>
                            <Badge variant="secondary" className="rounded-md">
                              {passenger.isAdult === false ? "Child" : "Adult"}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">Passenger {index + 1}</p>
                        </div>
                        {seat && (
                          <div className="flex w-fit items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
                            <Armchair className="h-4 w-4 text-primary" />
                            <span className="font-semibold text-foreground">
                              {seat.seatNumber || seat.seatPosition || "-"}
                            </span>
                            {seat.seatType && <Badge variant="outline">{seat.seatType}</Badge>}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <InfoTile label="Gender" value={passenger.gender} />
                        <InfoTile label="Date of birth" value={formatDate(passenger.dateOfBirth)} />
                        <InfoTile label="Age" value={passenger.age ? `${passenger.age} years` : "-"} />
                        <InfoTile label="Nationality" value={passenger.nationality} />
                        {passenger.email && <InfoTile icon={Mail} label="Email" value={passenger.email} />}
                        {passenger.phone && <InfoTile icon={Phone} label="Phone" value={passenger.phone} />}
                      </div>

                      {(passenger.requiresWheelchairAssistance || passenger.dietaryPreferences || passenger.medicalConditions) && (
                        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                          <p className="flex items-center gap-2 font-medium">
                            <Info className="h-4 w-4" />
                            Special requirements
                          </p>
                          <ul className="mt-2 list-inside list-disc space-y-1">
                            {passenger.requiresWheelchairAssistance && <li>Wheelchair assistance required</li>}
                            {passenger.dietaryPreferences && <li>Dietary preferences: {passenger.dietaryPreferences}</li>}
                            {passenger.medicalConditions && <li>Medical conditions: {passenger.medicalConditions}</li>}
                          </ul>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </SectionCard>

          {(meals.length > 0 || ancillaries.length > 0) && (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {meals.length > 0 && (
                <SectionCard icon={Utensils} title={`Meals (${meals.length})`}>
                  <div className="space-y-3">
                    {meals.map((mealItem) => (
                      <div key={mealItem.id} className="flex gap-3 rounded-xl border border-border/70 bg-muted/20 p-3">
                        {mealItem.meal?.imageUrl && (
                          <img
                            src={mealItem.meal.imageUrl}
                            alt={mealItem.meal.name}
                            className="h-14 w-14 shrink-0 rounded-lg object-cover"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className="truncate text-sm font-semibold text-foreground">{mealItem.meal?.name || "Meal"}</p>
                            <span className="shrink-0 text-sm font-semibold text-primary">
                              {mealItem.price ? formatMoney(mealItem.price, currency) : "Included"}
                            </span>
                          </div>
                          {mealItem.meal?.mealType && <Badge variant="outline" className="mt-2">{mealItem.meal.mealType}</Badge>}
                          {mealItem.meal?.dietaryRestriction && (
                            <p className="mt-1 text-xs text-muted-foreground">{mealItem.meal.dietaryRestriction}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}

              {ancillaries.length > 0 && (
                <SectionCard icon={Shield} title={`Ancillary Services (${ancillaries.length})`}>
                  <div className="space-y-3">
                    {ancillaries.map((item) => {
                      const coverages = Array.isArray(item.ancillary?.coverages) ? item.ancillary.coverages : []
                      return (
                        <div key={item.id} className="overflow-hidden rounded-xl border border-border/70 bg-muted/20">
                          <div className="p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-semibold text-foreground">{item.ancillary?.name || "Ancillary"}</p>
                                  {item.ancillary?.type && (
                                    <Badge variant="outline">{item.ancillary.type.replace(/_/g, " ")}</Badge>
                                  )}
                                </div>
                                {item.ancillary?.description && (
                                  <p className="mt-1 text-sm text-muted-foreground">{item.ancillary.description}</p>
                                )}
                              </div>
                              <p className="shrink-0 font-semibold text-primary">{formatMoney(item.price, item.currency || currency)}</p>
                            </div>

                            {coverages.length > 0 && (
                              <button
                                type="button"
                                onClick={() => toggleAncillary(item.id)}
                                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                              >
                                {expandedAncillary === item.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                {expandedAncillary === item.id ? "Hide" : "View"} {coverages.length} coverages
                              </button>
                            )}
                          </div>

                          {expandedAncillary === item.id && coverages.length > 0 && (
                            <div className="grid gap-3 border-t border-border/70 bg-background/50 p-3 sm:grid-cols-2">
                              {coverages.map((coverage) => (
                                <div key={coverage.id} className="rounded-lg border border-border/70 bg-card p-3">
                                  <p className="text-sm font-semibold text-foreground">{coverage.name}</p>
                                  {coverage.coverageType && <Badge variant="outline" className="mt-1">{coverage.coverageType.replace(/_/g, " ")}</Badge>}
                                  {coverage.description && <p className="mt-2 text-xs text-muted-foreground">{coverage.description}</p>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </SectionCard>
              )}
            </div>
          )}

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <SectionCard icon={Receipt} title="Fare Breakdown">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Fare type</span>
                  <span className="font-semibold text-foreground">{booking.fareName || "-"}</span>
                </div>
                <Separator />
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Base fare</span>
                  <span className="font-medium text-foreground">{formatMoney(booking.fareBaseFare, currency)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Taxes & fees</span>
                  <span className="font-medium text-foreground">{formatMoney(booking.fareTaxesAndFees, currency)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Airline fees</span>
                  <span className="font-medium text-foreground">{formatMoney(booking.fareAirlineFees, currency)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-4 rounded-lg bg-primary/10 p-3">
                  <span className="font-semibold text-foreground">Total amount</span>
                  <span className="text-xl font-bold text-primary">{formatMoney(booking.totalAmount, currency)}</span>
                </div>
              </div>
            </SectionCard>

            <SectionCard icon={CreditCard} title="Payment & Tickets">
              <div className="space-y-3">
                <InfoTile label="Payment status" value={booking.paymentStatus || "PENDING"} />
                <InfoTile label="Last modified" value={formatDate(booking.lastModified)} detail={formatTime(booking.lastModified)} />
                {tickets.length > 0 && (
                  <div className="space-y-2">
                    <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Ticket className="h-4 w-4 text-primary" />
                      Tickets
                    </p>
                    {tickets.map((ticket) => (
                      <div key={ticket.id} className="rounded-lg border border-border/70 bg-muted/20 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-mono text-sm font-semibold text-foreground">{ticket.ticketNumber}</p>
                            <p className="text-xs text-muted-foreground">
                              {[ticket.passengerFirstName, ticket.passengerLastName].filter(Boolean).join(" ")}
                            </p>
                          </div>
                          <Badge variant="outline">{ticket.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SectionCard>
          </div>

          {booking.specialRequests && (
            <SectionCard icon={Info} title="Special Requests" className="mt-4">
              <p className="text-sm text-muted-foreground">{booking.specialRequests}</p>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  )
}

export default BookingDetails
