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
  FileSpreadsheet
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  getAllAirlines,
  approveAirline,
  suspendAirline,
  banAirline,
  deleteAirline
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
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [itemsPerPage, setItemsPerPage] = React.useState(10)


  React.useEffect(() => {
    dispatch(getAllAirlines({
      page: currentPage - 1,
      size: itemsPerPage,
      sort: "name,asc"
    }))
  }, [dispatch, currentPage, itemsPerPage])

  const filteredAirlines = React.useMemo(() => {
    if (!airlines || airlines.length === 0) {
      return []
    }

    const normalize = (value) => String(value ?? "").toLowerCase().trim()
    const normalizedQuery = normalize(searchQuery)
    let filtered = [...airlines]

    if (normalizedQuery) {
      filtered = filtered.filter((airline) => {
        const searchableValues = [
          airline.id,
          airline.name,
          airline.alias,
          airline.iataCode,
          airline.icaoCode,
          airline.countryName,
          airline.countryCode,
          airline.alliance,
          airline.website,
          airline.ownerId,
          airline.owner?.fullName,
          airline.support?.email,
          airline.support?.phone
        ]

        return searchableValues.some((value) =>
          normalize(value).includes(normalizedQuery)
        )
      })
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (airline) => normalize(airline.status) === normalize(statusFilter)
      )
    }

    return filtered
  }, [airlines, searchQuery, statusFilter])

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
        label: "Inactive"
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

  const handleApprove = async (airlineId) => {
    try {
      await dispatch(approveAirline(airlineId)).unwrap()
      toast.success("Airline approved successfully")
    } catch (err) {
      toast.error(err || "Failed to approve airline")
    }
  }

  const handleReject = async (airlineId) => {
    if (window.confirm("Are you sure you want to reject this airline application?")) {
      try {
        await dispatch(deleteAirline(airlineId)).unwrap()
        toast.success("Airline rejected and deleted successfully")
      } catch (err) {
        toast.error(err || "Failed to reject airline")
      }
    }
  }

  const handleSuspend = async (airlineId) => {
    if (window.confirm("Are you sure you want to suspend this airline?")) {
      try {
        await dispatch(suspendAirline(airlineId)).unwrap()
        toast.success("Airline suspended successfully")
      } catch (err) {
        toast.error(err || "Failed to suspend airline")
      }
    }
  }

  const handleBan = async (airlineId) => {
    if (window.confirm("Are you sure you want to ban this airline?")) {
      try {
        await dispatch(banAirline(airlineId)).unwrap()
        toast.success("Airline banned successfully")
      } catch (err) {
        toast.error(err || "Failed to ban airline")
      }
    }
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
    const inactiveAirlines = airlines?.filter(a => a.status === "INACTIVE")?.length || 0
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
                  <p className="text-sm text-muted-foreground">Inactive</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{inactiveAirlines}</p>
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
              placeholder="Search airlines..."
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
    const pendingAirlines = airlines?.filter(a => a.status === "INACTIVE") || []

    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Airline Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingAirlines.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No pending airlines</p>
          ) : (
            <div className="space-y-4">
              {pendingAirlines.map((airline) => (
                <AirlineCard
                  key={airline.id}
                  airline={airline}
                  getStatusBadge={getStatusBadge}
                  getComplianceBadge={getComplianceBadge}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onSuspend={handleSuspend}
                  onBan={handleBan}
                  
                  showApprovalActions={true}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const renderSuspendedAirlines = () => {
    const suspendedAirlines = airlines?.filter(a => a.status === "BANNED") || []

    return (
      <Card>
        <CardHeader>
          <CardTitle>Suspended/Banned Airlines</CardTitle>
        </CardHeader>
        <CardContent>
          {suspendedAirlines.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No suspended airlines</p>
          ) : (
            <div className="space-y-4">
              {suspendedAirlines.map((airline) => (
                <AirlineCard
                  key={airline.id}
                  airline={airline}
                  getStatusBadge={getStatusBadge}
                  getComplianceBadge={getComplianceBadge}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onSuspend={handleSuspend}
                  onBan={handleBan}
                 
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const renderComplianceOverview = () => (
    <Card>
      <CardHeader>
        <CardTitle>Compliance Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">Monitor airline compliance status and documentation.</p>
        {airlines?.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No airlines found</p>
        ) : (
          <div className="space-y-4">
            {airlines?.map((airline) => (
              <div key={airline.id} className="border border-border bg-card rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">✈️</div>
                    <div>
                      <h4 className="font-medium text-foreground">{airline.name}</h4>
                      <p className="text-sm text-muted-foreground">{airline.iataCode}</p>
                    </div>
                  </div>
                  {getComplianceBadge(airline)}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground">IATA Code</span>
                    <p className="text-sm font-medium text-foreground">{airline.iataCode}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">ICAO Code</span>
                    <p className="text-sm font-medium text-foreground">{airline.icaoCode}</p>
                  </div>
                  {/* Country removed from overview */}
                  <div>
                    <span className="text-xs text-muted-foreground">Status</span>
                    <p className="text-sm font-medium text-foreground">{airline.status}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )

  const renderCommissionRules = () => (
    <Card>
      <CardHeader>
        <CardTitle>Commission Rules Management</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">Configure commission rates and GDS fees for airlines.</p>
        {airlines?.filter(a => a.status === "ACTIVE").length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No active airlines found</p>
        ) : (
          <div className="space-y-4">
            {airlines?.filter(a => a.status === "ACTIVE").map((airline) => (
              <div key={airline.id} className="border border-border bg-card rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">✈️</div>
                    <div>
                      <h4 className="font-medium text-foreground">{airline.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {airline.iataCode} / {airline.icaoCode}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Commission Rate</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">2.5%</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )

  return <div className="space-y-6">{renderContent()}</div>
}



export default AirlineManagement
