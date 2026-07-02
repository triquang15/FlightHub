import React from "react"
import {
  Ban,
  CalendarDays,
  CheckCircle,
  Clock,
  ExternalLink,
  Globe,
  Hash,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
  XCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const AirlineCard = ({
  airline,
  getStatusBadge,
  onApprove,
  onReject,
  onSuspend,
  onBan,
  showApprovalActions = false
}) => {
  const formatDate = (date) => {
    if (!date) return "N/A"

    const parsedDate = new Date(date)
    return Number.isNaN(parsedDate.getTime())
      ? "N/A"
      : parsedDate.toLocaleDateString()
  }

  const countryText = airline.countryName && airline.countryCode
    ? `${airline.countryName} (${airline.countryCode})`
    : airline.countryName || airline.countryCode || "N/A"

  const airlineInitials = airline.name
    ?.split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "AL"

  const codeText = [airline.iataCode, airline.icaoCode].filter(Boolean).join(" / ") || "N/A"
  const ownerText = airline.owner?.fullName || (airline.ownerId ? `Owner ID ${airline.ownerId}` : "N/A")
  const websiteHref = airline.website
    ? /^https?:\/\//i.test(airline.website)
      ? airline.website
      : `https://${airline.website}`
    : null

  const DetailItem = ({ icon: Icon, label, value, href }) => (
    <div className="min-w-0 rounded-md border border-border bg-muted/40 px-3 py-2">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span>{label}</span>
      </div>
      {href && value !== "N/A" ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="flex min-w-0 items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
        >
          <span className="truncate">{value}</span>
          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
        </a>
      ) : (
        <p className="truncate text-sm font-medium text-card-foreground">{value}</p>
      )}
    </div>
  )

  return (
    <div className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm transition-shadow hover:shadow-md dark:shadow-none dark:hover:border-border/80">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted text-sm font-semibold text-foreground">
            {airline.logoUrl ? (
              <img
                src={airline.logoUrl}
                alt={airline.name || "Airline logo"}
                className="h-full w-full object-contain"
              />
            ) : (
              airlineInitials
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-semibold text-foreground">
                {airline.name || "Unnamed airline"}
              </h3>
              {getStatusBadge(airline.status)}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{codeText}</span>
              {airline.alias && (
                <>
                  <span className="text-border">|</span>
                  <span className="truncate">{airline.alias}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          {showApprovalActions && airline.status === "PENDING" && (
            <>
              <Button size="sm" onClick={() => onApprove(airline.id)} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="mr-1 h-3.5 w-3.5" />
                Approve
              </Button>
              <Button variant="outline" size="sm" onClick={() => onReject(airline.id)} className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                <XCircle className="mr-1 h-3.5 w-3.5" />
                Reject
              </Button>
            </>
          )}

          {airline.status === "ACTIVE" && (
            <>
              <Button variant="outline" size="sm" onClick={() => onSuspend(airline.id)} className="text-yellow-700 hover:text-yellow-800 dark:text-yellow-300 dark:hover:text-yellow-200">
                <Clock className="mr-1 h-3.5 w-3.5" />
                Suspend
              </Button>
              <Button variant="outline" size="sm" onClick={() => onBan(airline.id)} className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                <Ban className="mr-1 h-3.5 w-3.5" />
                Ban
              </Button>
            </>
          )}

          {airline.status === "INACTIVE" && !showApprovalActions && (
            <Button size="sm" onClick={() => onApprove(airline.id)} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="mr-1 h-3.5 w-3.5" />
              Activate
            </Button>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DetailItem icon={MapPin} label="Country" value={countryText} />
        <DetailItem icon={Globe} label="Website" value={airline.website || "N/A"} href={websiteHref} />
        <DetailItem
          icon={Mail}
          label="Support email"
          value={airline.support?.email || "N/A"}
          href={airline.support?.email ? `mailto:${airline.support.email}` : null}
        />
        <DetailItem icon={Phone} label="Support phone" value={airline.support?.phone || "N/A"} />
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="gap-1 rounded-md border-border bg-background text-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            {airline.alliance || "No alliance"}
          </Badge>
          <Badge variant="outline" className="gap-1 rounded-md border-border bg-background text-foreground">
            <UserRound className="h-3.5 w-3.5" />
            {ownerText}
          </Badge>
          <Badge variant="outline" className="gap-1 rounded-md border-border bg-background text-foreground">
            <Hash className="h-3.5 w-3.5" />
            ID {airline.id || "N/A"}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            Created {formatDate(airline.createdAt)}
          </span>
          <span>
            Updated {formatDate(airline.updatedAt)}
            {airline.updatedById ? ` by user ${airline.updatedById}` : ""}
          </span>
        </div>
      </div>
    </div>
  )
}

export default AirlineCard
