import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  Database,
  PlugZap,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const moduleConfig = {
  settlements: {
    title: "Settlements",
    description: "Review airline-specific balances, fees, and settlement statements.",
    entities: ["Settlement period", "Gross bookings", "Platform fees", "Refunds", "Net payable"],
    workflows: ["Review statement", "Inspect adjustments", "Export statement", "Confirm settlement"],
  },
  team: {
    title: "Team & Access",
    description: "Manage staff access to this airline workspace without exposing other airlines.",
    entities: ["Team member", "Airline role", "Permission scope", "Invite status"],
    workflows: ["Invite member", "Assign role", "Review access", "Revoke access"],
  },
  activity: {
    title: "Activity Log",
    description: "Review operational and administrative changes made within this airline workspace.",
    entities: ["Actor", "Action", "Resource", "Timestamp", "Request metadata"],
    workflows: ["Search activity", "Filter by actor", "Review change", "Export log"],
  },
  integrations: {
    title: "Integrations",
    description: "Manage airline-owned provider connections, webhooks, and credentials.",
    entities: ["Provider", "Connection", "Credential reference", "Webhook", "Health"],
    workflows: ["Add connection", "Test provider", "Rotate credential", "Disable integration"],
  },
}

const AirlineOwnerModulePlaceholder = ({ module }) => {
  const config = moduleConfig[module] || moduleConfig.team

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5">
        <Badge variant="outline" className="mb-2 gap-1 rounded-md">
          <CircleDashed className="h-3.5 w-3.5" />
          Backend integration pending
        </Badge>
        <h2 className="text-2xl font-semibold tracking-tight">{config.title}</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{config.description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Airline scope", value: "Required", icon: CheckCircle2 },
          { label: "API source", value: "Not connected", icon: PlugZap },
          { label: "Records", value: "Awaiting backend", icon: Database },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="mt-1 text-sm font-semibold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Required Data</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {config.entities.map((entity) => (
              <div key={entity} className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{entity}</span>
                <Badge variant="secondary" className="ml-auto rounded-md text-[10px]">Pending</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Planned Workflows</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {config.workflows.map((workflow) => (
              <div key={workflow} className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{workflow}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <p className="text-sm">
          Actions remain disabled until the backend enforces airline ownership and permission scopes.
        </p>
      </div>
    </div>
  )
}

export default AirlineOwnerModulePlaceholder
