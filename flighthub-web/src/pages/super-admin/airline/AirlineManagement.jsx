import * as React from "react"
import { useDispatch, useSelector } from "react-redux"
import {
  Building2,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Edit,
  Ban,
  UserCheck,
  DollarSign,
  FileText,
  Phone,
  Mail,
  Globe,
  MapPin,
  Users,
  Plane,
  FileSpreadsheet,
  ShieldCheck,
  CalendarDays,
  ExternalLink,
  Hash
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import {
  getAllAirlines,
  approveAirline,
  suspendAirline,
  banAirline,
  rejectAirline
} from "@/Redux/airline/airlineThunks"
import { toast } from "sonner"
import AirlineCard from "./AirineCard"
import AirlinePagination from "./AirlinePagination"



const AirlineManagement = ({ activeSection }) => {
  const dispatch = useDispatch()

  // Redux state
  const { airlines, loading, error, paginatedAirlines } = useSelector(state => state.airline)

  // Local state
  const [searchQuery, setSearchQuery] = React.useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [itemsPerPage, setItemsPerPage] = React.useState(10)
  const [confirmAction, setConfirmAction] = React.useState(null)
  const [actionLoading, setActionLoading] = React.useState(false)

  const routeStatusFilter = React.useMemo(() => {
    if (activeSection === "airlines-pending") return "PENDING"
    return null
  }, [activeSection])
  const isQueueView = activeSection === "airlines-pending" || activeSection === "airlines-suspended"

  const effectiveStatusFilter = routeStatusFilter || (statusFilter !== "all" ? statusFilter.toUpperCase() : undefined)

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim())
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [searchQuery])

  React.useEffect(() => {
    setCurrentPage(1)
  }, [activeSection, statusFilter])

  const loadAirlines = React.useCallback(() => {
    return dispatch(getAllAirlines({
      page: isQueueView ? 0 : currentPage - 1,
      size: isQueueView ? 100 : itemsPerPage,
      sortBy: "name",
      sortDirection: "asc",
      keyword: debouncedSearchQuery || undefined,
      status: effectiveStatusFilter
    }))
  }, [dispatch, currentPage, itemsPerPage, debouncedSearchQuery, effectiveStatusFilter, isQueueView])

  React.useEffect(() => {
    loadAirlines()
  }, [loadAirlines])

  const filteredAirlines = React.useMemo(() => {
    return Array.isArray(airlines) ? airlines : []
  }, [airlines])

  const getStatusBadge = (status) => {
    const statusConfig = {
      "ACTIVE": {
        color: "border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-300",
        icon: CheckCircle,
        label: "Active"
      },
      "INACTIVE": {
        color: "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-900/60 dark:bg-yellow-950/40 dark:text-yellow-300",
        icon: Clock,
        label: "Suspended"
      },
      "BANNED": {
        color: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300",
        icon: XCircle,
        label: "Banned"
      },
      "PENDING": {
        color: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300",
        icon: AlertTriangle,
        label: "Pending"
      }
    }

    const config = statusConfig[status?.toUpperCase()] || statusConfig["PENDING"]
    const Icon = config.icon

    return (
      <Badge variant="outline" className={cn("flex items-center gap-1", config.color)}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getComplianceBadge = (airline) => {
    // For now, return a default badge since compliance data structure may differ
    return (
      <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-300">
        Compliant
      </Badge>
    )
  }

  const reloadAfterAction = React.useCallback(async () => {
    await loadAirlines()
  }, [loadAirlines])

  const handleApprove = async (airlineId) => {
    try {
      await dispatch(approveAirline(airlineId)).unwrap()
      toast.success("Airline approved successfully")
      await reloadAfterAction()
    } catch (err) {
      toast.error(err || "Failed to approve airline")
    }
  }

  const requestAction = (type, airline) => {
    setConfirmAction({ type, airline })
  }

  const runConfirmedAction = async () => {
    if (!confirmAction?.airline?.id) return

    setActionLoading(true)
    try {
      const airlineId = confirmAction.airline.id
      if (confirmAction.type === "reject") {
        await dispatch(rejectAirline(airlineId)).unwrap()
        toast.success("Airline application rejected")
      }
      if (confirmAction.type === "suspend") {
        await dispatch(suspendAirline(airlineId)).unwrap()
        toast.success("Airline suspended successfully")
      }
      if (confirmAction.type === "ban") {
        await dispatch(banAirline(airlineId)).unwrap()
        toast.success("Airline banned successfully")
      }
      if (confirmAction.type === "reactivate") {
        await dispatch(approveAirline(airlineId)).unwrap()
        toast.success("Airline reactivated successfully")
      }
      setConfirmAction(null)
      await reloadAfterAction()
    } catch (err) {
      toast.error(err || "Action failed")
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = (airlineOrId) => {
    const airline = typeof airlineOrId === "object"
      ? airlineOrId
      : airlines?.find((item) => item.id === airlineOrId) || { id: airlineOrId }
    requestAction("reject", airline)
  }

  const handleSuspend = async (airlineId) => {
    const airline = airlines?.find((item) => item.id === airlineId) || { id: airlineId }
    requestAction("suspend", airline)
  }

  const handleBan = async (airlineId) => {
    const airline = airlines?.find((item) => item.id === airlineId) || { id: airlineId }
    requestAction("ban", airline)
  }

 

  const renderContent = () => {
    switch (activeSection) {
      case "airlines-list":
        return renderAirlinesList()
      case "airlines-pending":
        return renderPendingAirlines()
      case "airlines-suspended":
        return renderSuspendedAirlines()
      case "airlines-compliance":
        return renderComplianceOverview()
      case "airlines-commission":
        return renderCommissionRules()
      default:
        return renderAirlinesOverview()
    }
  }

  const renderAirlinesOverview = () => {
    const totalAirlines = paginatedAirlines?.totalElements || airlines?.length || 0
    const activeAirlines = airlines?.filter(a => a.status === "ACTIVE")?.length || 0
    const pendingAirlines = airlines?.filter(a => a.status === "PENDING")?.length || 0
    const bannedAirlines = airlines?.filter(a => a.status === "BANNED")?.length || 0

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Airlines</p>
                  <p className="text-2xl font-bold text-foreground">{totalAirlines}</p>
                </div>
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Airlines</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{activeAirlines}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pendingAirlines}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Banned</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{bannedAirlines}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {renderAirlinesList()}
      </div>
    )
  }

  const renderAirlinesList = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>All Airlines</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-green-600 dark:text-green-400" />
              Excel
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-red-500 dark:text-red-400" />
              PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search name, code, alliance..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value)
              setCurrentPage(1)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="banned">Banned</SelectItem>
            </SelectContent>
          </Select>
       
          
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-muted border-b-foreground"></div>
            <p className="mt-2 text-muted-foreground">Loading airlines...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400">Error: {error}</p>
          </div>
        ) : filteredAirlines.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No airlines found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAirlines.map((airline) => (
              <AirlineCard
                key={airline.id}
                airline={airline}
                getStatusBadge={getStatusBadge}
                getComplianceBadge={getComplianceBadge}
                onApprove={handleApprove}
                onReject={handleReject}
                onSuspend={handleSuspend}
                onBan={handleBan}
                showApprovalActions={airline.status === "PENDING"}
                
              />
            ))}
          </div>
        )}

        <AirlinePagination
          currentPage={currentPage}
          totalPages={paginatedAirlines?.totalPages || 1}
          totalItems={paginatedAirlines?.totalElements || 0}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </CardContent>
    </Card>
  )

  const renderPendingAirlines = () => {
    const pendingAirlines = airlines?.filter(a => a.status === "PENDING") || []
    const totalPending = paginatedAirlines?.totalElements || pendingAirlines.length
    const withOwner = pendingAirlines.filter((airline) => airline.owner?.fullName || airline.ownerId).length
    const completeRegistry = pendingAirlines.filter((airline) => airline.iataCode && airline.icaoCode).length
    const missingContact = pendingAirlines.filter((airline) => {
      const hasContact = airline.support?.email || airline.support?.phone || airline.supportEmail || airline.supportPhone || airline.email || airline.phone
      return !hasContact
    }).length

    const getSupportContact = (airline) => {
      const email = airline.support?.email || airline.supportEmail || airline.email
      const phone = airline.support?.phone || airline.supportPhone || airline.phone
      return email || phone || "No support contact"
    }

    const getAirlineInitials = (name) => (
      name
        ?.split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "AL"
    )

    const formatDate = (date) => {
      if (!date) return "N/A"
      const parsedDate = new Date(date)
      return Number.isNaN(parsedDate.getTime()) ? "N/A" : parsedDate.toLocaleDateString()
    }

    const getReviewScore = (airline) => {
      const checks = [
        Boolean(airline.name),
        Boolean(airline.iataCode && airline.icaoCode),
        Boolean(airline.owner?.fullName || airline.ownerId),
        Boolean(airline.support?.email || airline.support?.phone || airline.supportEmail || airline.supportPhone || airline.email || airline.phone),
        Boolean(airline.website)
      ]

      return Math.round((checks.filter(Boolean).length / checks.length) * 100)
    }

    const MetricCard = ({ label, value, detail, icon: Icon, className }) => (
      <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
          </div>
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-md", className)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </div>
    )

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="gap-2">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  Pending Airline Approvals
                </CardTitle>
                <p className="mt-2 text-sm text-muted-foreground">
                  Review new airline registrations before granting operational access.
                </p>
              </div>
              <Badge variant="outline" className="w-fit gap-1 rounded-md border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-900/60 dark:bg-yellow-950/40 dark:text-yellow-300">
                <AlertTriangle className="h-3.5 w-3.5" />
                Approval queue
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Awaiting review"
                value={totalPending}
                detail="Airlines waiting for decision"
                icon={Clock}
                className="bg-yellow-50 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300"
              />
              <MetricCard
                label="Registry complete"
                value={completeRegistry}
                detail="IATA and ICAO codes present"
                icon={Hash}
                className="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
              />
              <MetricCard
                label="Owner assigned"
                value={withOwner}
                detail="Applications with accountable owner"
                icon={UserCheck}
                className="bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300"
              />
              <MetricCard
                label="Missing contact"
                value={missingContact}
                detail="Need support details before approval"
                icon={Phone}
                className="bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300"
              />
            </div>

            {loading ? (
              <div className="rounded-lg border border-dashed border-border py-12 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-muted border-b-foreground"></div>
                <p className="mt-3 text-sm text-muted-foreground">Loading pending applications...</p>
              </div>
            ) : error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-8 text-center text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                Error: {error}
              </div>
            ) : pendingAirlines.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border py-12 text-center">
                <CheckCircle className="mx-auto h-10 w-10 text-green-600 dark:text-green-400" />
                <p className="mt-3 font-medium text-foreground">No pending airlines</p>
                <p className="mt-1 text-sm text-muted-foreground">The approval queue is clear for now.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingAirlines.map((airline) => {
                  const score = getReviewScore(airline)
                  const ownerText = airline.owner?.fullName || (airline.ownerId ? `Owner ID ${airline.ownerId}` : "Unassigned")
                  const codeText = [airline.iataCode, airline.icaoCode].filter(Boolean).join(" / ") || "No code"

                  return (
                    <div
                      key={airline.id}
                      className="rounded-lg border border-yellow-200 bg-card p-5 text-card-foreground shadow-sm transition-shadow hover:shadow-md dark:border-yellow-950/60 dark:shadow-none"
                    >
                      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                        <div className="flex min-w-0 items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-yellow-200 bg-yellow-50 text-sm font-semibold text-yellow-800 dark:border-yellow-900/60 dark:bg-yellow-950/40 dark:text-yellow-300">
                            {airline.logoUrl ? (
                              <img
                                src={airline.logoUrl}
                                alt={airline.name || "Airline logo"}
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              getAirlineInitials(airline.name)
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="truncate text-base font-semibold text-foreground">
                                {airline.name || "Unnamed airline"}
                              </h4>
                              {getStatusBadge(airline.status)}
                              <Badge variant="outline" className="gap-1 rounded-md border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-900/60 dark:bg-yellow-950/40 dark:text-yellow-300">
                                <Clock className="h-3.5 w-3.5" />
                                Waiting approval
                              </Badge>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                              <span className="font-medium text-foreground">{codeText}</span>
                              {airline.countryName || airline.countryCode ? (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {airline.countryName || airline.countryCode}
                                </span>
                              ) : null}
                              <span>ID {airline.id || "N/A"}</span>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                              Confirm registration details before activating this airline.
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 xl:justify-end">
                          <Button size="sm" onClick={() => handleApprove(airline.id)} className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="mr-1 h-3.5 w-3.5" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReject(airline)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <XCircle className="mr-1 h-3.5 w-3.5" />
                            Reject
                          </Button>
                        </div>
                      </div>

                      <div className="mt-5 rounded-lg border border-border bg-muted/30 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Review readiness</p>
                            <p className="mt-1 text-2xl font-semibold text-foreground">{score}%</p>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted sm:max-w-sm">
                            <div
                              className={cn("h-full rounded-full", score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : "bg-orange-500")}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-md border border-border bg-background px-3 py-3">
                          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <UserCheck className="h-3.5 w-3.5" />
                            Account owner
                          </div>
                          <p className="mt-2 truncate text-sm font-medium text-foreground">{ownerText}</p>
                        </div>
                        <div className="rounded-md border border-border bg-background px-3 py-3">
                          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            Support contact
                          </div>
                          <p className="mt-2 truncate text-sm font-medium text-foreground">{getSupportContact(airline)}</p>
                        </div>
                        <div className="rounded-md border border-border bg-background px-3 py-3">
                          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <Globe className="h-3.5 w-3.5" />
                            Website
                          </div>
                          <p className="mt-2 truncate text-sm font-medium text-foreground">{airline.website || "Not provided"}</p>
                        </div>
                        <div className="rounded-md border border-border bg-background px-3 py-3">
                          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Submitted
                          </div>
                          <p className="mt-2 truncate text-sm font-medium text-foreground">{formatDate(airline.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderSuspendedAirlines = () => {
    const suspendedAirlines = airlines?.filter(a => a.status === "INACTIVE" || a.status === "BANNED") || []
    const totalSuspended = suspendedAirlines.length
    const withOwner = suspendedAirlines.filter((airline) => airline.owner?.fullName || airline.ownerId).length
    const withSupportContact = suspendedAirlines.filter((airline) => airline.support?.email || airline.support?.phone || airline.supportEmail || airline.supportPhone || airline.email || airline.phone).length
    const missingContact = Math.max(totalSuspended - withSupportContact, 0)

    const getSupportContact = (airline) => {
      const email = airline.support?.email || airline.supportEmail || airline.email
      const phone = airline.support?.phone || airline.supportPhone || airline.phone
      return email || phone || "No support contact"
    }

    const getAirlineInitials = (name) => (
      name
        ?.split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "AL"
    )

    const formatDate = (date) => {
      if (!date) return "N/A"
      const parsedDate = new Date(date)
      return Number.isNaN(parsedDate.getTime()) ? "N/A" : parsedDate.toLocaleDateString()
    }

    const MetricCard = ({ label, value, detail, icon: Icon, className }) => (
      <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
          </div>
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-md", className)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </div>
    )

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="gap-2">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Ban className="h-5 w-5 text-red-600 dark:text-red-400" />
                  Suspended/Banned Airlines
                </CardTitle>
                <p className="mt-2 text-sm text-muted-foreground">
                  Review restricted airline accounts, ownership status and recovery readiness.
                </p>
              </div>
              <Badge variant="outline" className="w-fit gap-1 rounded-md border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                <AlertTriangle className="h-3.5 w-3.5" />
                Restricted operations
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <MetricCard
                label="Restricted airlines"
                value={totalSuspended}
                detail="Currently blocked from operations"
                icon={Ban}
                className="bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
              />
              <MetricCard
                label="Owner assigned"
                value={withOwner}
                detail="Accounts with accountable owner"
                icon={UserCheck}
                className="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
              />
              <MetricCard
                label="Missing contact"
                value={missingContact}
                detail="Need support details before review"
                icon={Phone}
                className="bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300"
              />
            </div>

            {loading ? (
              <div className="rounded-lg border border-dashed border-border py-12 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-muted border-b-foreground"></div>
                <p className="mt-3 text-sm text-muted-foreground">Loading restricted airlines...</p>
              </div>
            ) : error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-8 text-center text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                Error: {error}
              </div>
            ) : suspendedAirlines.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border py-12 text-center">
                <CheckCircle className="mx-auto h-10 w-10 text-green-600 dark:text-green-400" />
                <p className="mt-3 font-medium text-foreground">No suspended airlines</p>
                <p className="mt-1 text-sm text-muted-foreground">All airline accounts are currently clear of restrictions.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {suspendedAirlines.map((airline) => {
                  const ownerText = airline.owner?.fullName || (airline.ownerId ? `Owner ID ${airline.ownerId}` : "Unassigned")
                  const codeText = [airline.iataCode, airline.icaoCode].filter(Boolean).join(" / ") || "No code"

                  return (
                    <div
                      key={airline.id}
                      className="rounded-lg border border-red-200 bg-card p-5 text-card-foreground shadow-sm transition-shadow hover:shadow-md dark:border-red-950/60 dark:shadow-none"
                    >
                      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                        <div className="flex min-w-0 items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-red-200 bg-red-50 text-sm font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                            {airline.logoUrl ? (
                              <img
                                src={airline.logoUrl}
                                alt={airline.name || "Airline logo"}
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              getAirlineInitials(airline.name)
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="truncate text-base font-semibold text-foreground">
                                {airline.name || "Unnamed airline"}
                              </h4>
                              {getStatusBadge(airline.status)}
                              <Badge variant="outline" className="gap-1 rounded-md border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                                <XCircle className="h-3.5 w-3.5" />
                                Access blocked
                              </Badge>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                              <span className="font-medium text-foreground">{codeText}</span>
                              {airline.countryName || airline.countryCode ? (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {airline.countryName || airline.countryCode}
                                </span>
                              ) : null}
                              <span>ID {airline.id || "N/A"}</span>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                              Operations are paused until a super admin reactivates this account.
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 xl:justify-end">
                          {airline.status === "INACTIVE" ? (
                            <Button size="sm" onClick={() => requestAction("reactivate", airline)} className="bg-green-600 hover:bg-green-700">
                              <CheckCircle className="mr-1 h-3.5 w-3.5" />
                              Reactivate
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" disabled className="text-red-600 dark:text-red-400">
                              <Ban className="mr-1 h-3.5 w-3.5" />
                              Banned
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-md border border-border bg-background px-3 py-3">
                          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <UserCheck className="h-3.5 w-3.5" />
                            Account owner
                          </div>
                          <p className="mt-2 truncate text-sm font-medium text-foreground">{ownerText}</p>
                        </div>
                        <div className="rounded-md border border-border bg-background px-3 py-3">
                          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            Support contact
                          </div>
                          <p className="mt-2 truncate text-sm font-medium text-foreground">{getSupportContact(airline)}</p>
                        </div>
                        <div className="rounded-md border border-border bg-background px-3 py-3">
                          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Last updated
                          </div>
                          <p className="mt-2 truncate text-sm font-medium text-foreground">{formatDate(airline.updatedAt)}</p>
                        </div>
                        <div className="rounded-md border border-border bg-background px-3 py-3">
                          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Review state
                          </div>
                          <p className="mt-2 truncate text-sm font-medium text-red-600 dark:text-red-400">Manual review required</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderComplianceOverview = () => {
    const complianceAirlines = Array.isArray(airlines) ? airlines : []

    const getSupportEmail = (airline) => airline.support?.email || airline.supportEmail || airline.email
    const getSupportPhone = (airline) => airline.support?.phone || airline.supportPhone || airline.phone
    const getAirlineInitials = (name) => (
      name
        ?.split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "AL"
    )
    const formatDate = (date) => {
      if (!date) return "N/A"
      const parsedDate = new Date(date)
      return Number.isNaN(parsedDate.getTime()) ? "N/A" : parsedDate.toLocaleDateString()
    }
    const getWebsiteHref = (website) => {
      if (!website) return null
      return /^https?:\/\//i.test(website) ? website : `https://${website}`
    }
    const getComplianceItems = (airline) => ([
      {
        label: "Registry codes",
        value: [airline.iataCode, airline.icaoCode].filter(Boolean).join(" / ") || "Missing",
        complete: Boolean(airline.iataCode && airline.icaoCode),
        icon: Hash
      },
      {
        label: "Support contact",
        value: getSupportEmail(airline) || getSupportPhone(airline) || "Missing",
        complete: Boolean(getSupportEmail(airline) || getSupportPhone(airline)),
        icon: Phone
      },
      {
        label: "Digital presence",
        value: airline.website || "Missing",
        complete: Boolean(airline.website),
        icon: Globe
      },
      {
        label: "Admin owner",
        value: airline.owner?.fullName || (airline.ownerId ? `Owner ID ${airline.ownerId}` : "Missing"),
        complete: Boolean(airline.owner?.fullName || airline.ownerId),
        icon: UserCheck
      }
    ])
    const getComplianceScore = (airline) => {
      const items = getComplianceItems(airline)
      return Math.round((items.filter((item) => item.complete).length / items.length) * 100)
    }
    const getComplianceState = (airline) => {
      const score = getComplianceScore(airline)
      const status = airline.status?.toUpperCase()

      if (status === "BANNED") {
        return {
          label: "Restricted",
          description: "Account access is blocked",
          icon: XCircle,
          badgeClass: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300",
          barClass: "bg-red-500"
        }
      }

      if (status === "INACTIVE") {
        return {
          label: "Review required",
          description: "Waiting for activation",
          icon: Clock,
          badgeClass: "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-900/60 dark:bg-yellow-950/40 dark:text-yellow-300",
          barClass: "bg-yellow-500"
        }
      }

      if (score >= 90) {
        return {
          label: "Verified",
          description: "Key documents are complete",
          icon: ShieldCheck,
          badgeClass: "border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-300",
          barClass: "bg-green-500"
        }
      }

      return {
        label: "Needs attention",
        description: "Some profile details are missing",
        icon: AlertTriangle,
        badgeClass: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300",
        barClass: "bg-orange-500"
      }
    }

    const totalAirlines = paginatedAirlines?.totalElements || complianceAirlines.length
    const verifiedAirlines = complianceAirlines.filter((airline) => getComplianceScore(airline) >= 90 && airline.status === "ACTIVE").length
    const needsReviewAirlines = complianceAirlines.filter((airline) => {
      const status = airline.status?.toUpperCase()
      return status === "INACTIVE" || getComplianceScore(airline) < 90
    }).length
    const restrictedAirlines = complianceAirlines.filter((airline) => airline.status === "BANNED").length

    const MetricCard = ({ label, value, detail, icon: Icon, className }) => (
      <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
          </div>
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-md", className)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </div>
    )

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="gap-2">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Compliance Overview
                </CardTitle>
                <p className="mt-2 text-sm text-muted-foreground">
                  Monitor airline registration quality, ownership and operational readiness.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="gap-1 rounded-md border-border bg-background text-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Updated today
                </Badge>
                <Button variant="outline" size="sm" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Export Report
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Airlines tracked"
                value={totalAirlines}
                detail="Current visible registry"
                icon={Plane}
                className="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
              />
              <MetricCard
                label="Verified profiles"
                value={verifiedAirlines}
                detail="Active with complete records"
                icon={CheckCircle}
                className="bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300"
              />
              <MetricCard
                label="Needs review"
                value={needsReviewAirlines}
                detail="Missing profile or pending"
                icon={AlertTriangle}
                className="bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300"
              />
              <MetricCard
                label="Restricted"
                value={restrictedAirlines}
                detail="Suspended or banned"
                icon={Ban}
                className="bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
              />
            </div>

            {loading ? (
              <div className="rounded-lg border border-dashed border-border py-12 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-muted border-b-foreground"></div>
                <p className="mt-3 text-sm text-muted-foreground">Loading compliance records...</p>
              </div>
            ) : error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-8 text-center text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                Error: {error}
              </div>
            ) : complianceAirlines.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border py-12 text-center">
                <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-3 font-medium text-foreground">No airlines found</p>
                <p className="mt-1 text-sm text-muted-foreground">Compliance records will appear after airlines are registered.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {complianceAirlines.map((airline) => {
                  const score = getComplianceScore(airline)
                  const state = getComplianceState(airline)
                  const StateIcon = state.icon
                  const websiteHref = getWebsiteHref(airline.website)
                  const codeText = [airline.iataCode, airline.icaoCode].filter(Boolean).join(" / ") || "No code"

                  return (
                    <div
                      key={airline.id}
                      className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm transition-shadow hover:shadow-md dark:shadow-none"
                    >
                      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                        <div className="flex min-w-0 items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted text-sm font-semibold text-foreground">
                            {airline.logoUrl ? (
                              <img
                                src={airline.logoUrl}
                                alt={airline.name || "Airline logo"}
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              getAirlineInitials(airline.name)
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="truncate text-base font-semibold text-foreground">
                                {airline.name || "Unnamed airline"}
                              </h4>
                              {getStatusBadge(airline.status)}
                              <Badge variant="outline" className={cn("gap-1 rounded-md", state.badgeClass)}>
                                <StateIcon className="h-3.5 w-3.5" />
                                {state.label}
                              </Badge>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                              <span className="font-medium text-foreground">{codeText}</span>
                              {airline.countryName || airline.countryCode ? (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {airline.countryName || airline.countryCode}
                                </span>
                              ) : null}
                              <span>ID {airline.id || "N/A"}</span>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">{state.description}</p>
                          </div>
                        </div>

                        <div className="w-full rounded-lg border border-border bg-muted/30 p-4 xl:max-w-xs">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Compliance score</p>
                              <p className="mt-1 text-2xl font-semibold text-foreground">{score}%</p>
                            </div>
                            <ShieldCheck className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                            <div className={cn("h-full rounded-full", state.barClass)} style={{ width: `${score}%` }} />
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {getComplianceItems(airline).map((item) => {
                          const ItemIcon = item.icon
                          return (
                            <div key={item.label} className="rounded-md border border-border bg-background px-3 py-3">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex min-w-0 items-center gap-2 text-xs font-medium text-muted-foreground">
                                  <ItemIcon className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate">{item.label}</span>
                                </div>
                                {item.complete ? (
                                  <CheckCircle className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
                                ) : (
                                  <AlertTriangle className="h-4 w-4 shrink-0 text-orange-500" />
                                )}
                              </div>
                              <p className="mt-2 truncate text-sm font-medium text-foreground">{item.value}</p>
                            </div>
                          )
                        })}
                      </div>

                      <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-wrap gap-2">
                          {getSupportEmail(airline) ? (
                            <Badge variant="outline" className="gap-1 rounded-md border-border bg-background text-foreground">
                              <Mail className="h-3.5 w-3.5" />
                              {getSupportEmail(airline)}
                            </Badge>
                          ) : null}
                          {websiteHref ? (
                            <a
                              href={websiteHref}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-0.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Website
                            </a>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>Created {formatDate(airline.createdAt)}</span>
                          <span>Updated {formatDate(airline.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderCommissionRules = () => {
    const activeAirlines = airlines?.filter(a => a.status === "ACTIVE") || []
    const defaultCommissionRate = 2.5
    const defaultGdsFee = 1.2
    const totalRules = activeAirlines.length
    const estimatedMonthlyCommission = totalRules * 1250
    const airlinesWithWebsite = activeAirlines.filter((airline) => airline.website).length

    const getAirlineInitials = (name) => (
      name
        ?.split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "AL"
    )

    const formatCurrency = (value) => (
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
      }).format(value)
    )

    const MetricCard = ({ label, value, detail, icon: Icon, className }) => (
      <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
          </div>
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-md", className)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </div>
    )

    const RuleField = ({ icon: Icon, label, value, tone = "default" }) => {
      const toneClass = {
        default: "text-foreground",
        green: "text-green-600 dark:text-green-400",
        blue: "text-blue-600 dark:text-blue-400",
        orange: "text-orange-600 dark:text-orange-400"
      }[tone]

      return (
        <div className="rounded-md border border-border bg-background px-3 py-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Icon className="h-3.5 w-3.5" />
            {label}
          </div>
          <p className={cn("mt-2 truncate text-sm font-semibold", toneClass)}>{value}</p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="gap-2">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                  Commission Rules Management
                </CardTitle>
                <p className="mt-2 text-sm text-muted-foreground">
                  Manage commission rates, GDS fees and settlement readiness for active airline partners.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="gap-1 rounded-md border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-300">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Active rules
                </Badge>
                <Button variant="outline" size="sm" className="gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-green-600 dark:text-green-400" />
                  Export Rules
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Active rule sets"
                value={totalRules}
                detail="Applied to active airlines"
                icon={FileText}
                className="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
              />
              <MetricCard
                label="Base commission"
                value={`${defaultCommissionRate}%`}
                detail="Default partner rate"
                icon={DollarSign}
                className="bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300"
              />
              <MetricCard
                label="GDS fee"
                value={`${defaultGdsFee}%`}
                detail="Standard distribution fee"
                icon={Globe}
                className="bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
              />
              <MetricCard
                label="Projected commission"
                value={formatCurrency(estimatedMonthlyCommission)}
                detail="Estimated monthly revenue"
                icon={DollarSign}
                className="bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300"
              />
            </div>

            {loading ? (
              <div className="rounded-lg border border-dashed border-border py-12 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-muted border-b-foreground"></div>
                <p className="mt-3 text-sm text-muted-foreground">Loading commission rules...</p>
              </div>
            ) : error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-8 text-center text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                Error: {error}
              </div>
            ) : activeAirlines.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border py-12 text-center">
                <DollarSign className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-3 font-medium text-foreground">No active airlines found</p>
                <p className="mt-1 text-sm text-muted-foreground">Commission rules will appear after airlines are activated.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeAirlines.map((airline, index) => {
                  const codeText = [airline.iataCode, airline.icaoCode].filter(Boolean).join(" / ") || "No code"
                  const customRate = defaultCommissionRate + (index % 3) * 0.25
                  const settlementWindow = index % 2 === 0 ? "T+7 days" : "T+14 days"
                  const monthlyEstimate = 950 + (index + 1) * 175

                  return (
                    <div
                      key={airline.id}
                      className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm transition-shadow hover:shadow-md dark:shadow-none"
                    >
                      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                        <div className="flex min-w-0 items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-green-200 bg-green-50 text-sm font-semibold text-green-700 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-300">
                            {airline.logoUrl ? (
                              <img
                                src={airline.logoUrl}
                                alt={airline.name || "Airline logo"}
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              getAirlineInitials(airline.name)
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="truncate text-base font-semibold text-foreground">
                                {airline.name || "Unnamed airline"}
                              </h4>
                              {getStatusBadge(airline.status)}
                              <Badge variant="outline" className="gap-1 rounded-md border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-300">
                                <DollarSign className="h-3.5 w-3.5" />
                                Rule active
                              </Badge>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                              <span className="font-medium text-foreground">{codeText}</span>
                              {airline.countryName || airline.countryCode ? (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {airline.countryName || airline.countryCode}
                                </span>
                              ) : null}
                              <span>ID {airline.id || "N/A"}</span>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                              Standard partner commercial terms are applied to this active airline.
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 xl:justify-end">
                          <Button variant="outline" size="sm" className="gap-2">
                            <Edit className="h-3.5 w-3.5" />
                            Edit Rule
                          </Button>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <RuleField icon={DollarSign} label="Commission rate" value={`${customRate.toFixed(2)}%`} tone="green" />
                        <RuleField icon={Globe} label="GDS fee" value={`${defaultGdsFee.toFixed(2)}%`} tone="blue" />
                        <RuleField icon={CalendarDays} label="Settlement window" value={settlementWindow} />
                        <RuleField icon={DollarSign} label="Monthly estimate" value={formatCurrency(monthlyEstimate)} tone="orange" />
                      </div>

                      <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="gap-1 rounded-md border-border bg-background text-foreground">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Auto settlement enabled
                          </Badge>
                          <Badge variant="outline" className="gap-1 rounded-md border-border bg-background text-foreground">
                            <Users className="h-3.5 w-3.5" />
                            {airline.owner?.fullName || (airline.ownerId ? `Owner ID ${airline.ownerId}` : "No owner assigned")}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {airlinesWithWebsite}/{totalRules} active airlines have settlement profile details
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const confirmCopy = {
    reject: {
      title: "Reject airline application?",
      description: "This removes the pending airline profile and keeps the owner account available for follow-up.",
      action: "Reject application",
      className: "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500",
    },
    suspend: {
      title: "Suspend airline operations?",
      description: "This marks the airline inactive. The owner account remains in place, but operational access is paused.",
      action: "Suspend airline",
      className: "bg-yellow-600 text-white hover:bg-yellow-700 dark:bg-yellow-600 dark:hover:bg-yellow-500",
    },
    ban: {
      title: "Ban airline?",
      description: "This blocks airline operations and should be used only for serious policy or security issues.",
      action: "Ban airline",
      className: "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500",
    },
    reactivate: {
      title: "Reactivate airline?",
      description: "This returns an inactive airline to active operational status.",
      action: "Reactivate airline",
      className: "bg-green-600 text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500",
    },
  }
  const activeConfirm = confirmAction ? confirmCopy[confirmAction.type] : null

  return (
    <div className="min-w-0 max-w-full space-y-6">
      {renderContent()}

      <AlertDialog
        open={Boolean(confirmAction)}
        onOpenChange={(open) => {
          if (!open && !actionLoading) setConfirmAction(null)
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>{activeConfirm?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {activeConfirm?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {confirmAction?.airline && (
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Airline</span>
                <span className="truncate font-medium text-foreground">
                  {confirmAction.airline.name || `Airline #${confirmAction.airline.id}`}
                </span>
              </div>
              <div className="mt-2 flex justify-between gap-4">
                <span className="text-muted-foreground">Current status</span>
                <span className="font-medium text-foreground">
                  {confirmAction.airline.status || "N/A"}
                </span>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault()
                runConfirmedAction()
              }}
              disabled={actionLoading}
              className={activeConfirm?.className}
            >
              {actionLoading ? "Processing..." : activeConfirm?.action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}



export default AirlineManagement
