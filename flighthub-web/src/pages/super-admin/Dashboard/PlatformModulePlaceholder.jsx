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
  roles: {
    title: "Roles & Permissions",
    description: "Define platform roles, permission scopes, and privileged-access policies.",
    entities: ["Roles", "Permissions", "Role assignments", "Policy versions"],
    workflows: ["Create role", "Review permissions", "Assign users", "Revoke access"],
  },
  audit: {
    title: "Audit Logs",
    description: "Review immutable administrative actions and security-sensitive platform events.",
    entities: ["Actor", "Action", "Resource", "Timestamp", "Request metadata"],
    workflows: ["Search events", "Filter by actor", "Export evidence", "Investigate changes"],
  },
  airlineCompliance: {
    title: "Airline Compliance",
    description: "Review airline verification evidence, operating permissions, and compliance attestations.",
    entities: ["Airline", "Document", "Verification status", "Reviewer", "Expiry date"],
    workflows: ["Review document", "Request update", "Approve evidence", "Export compliance pack"],
  },
  airlineCommission: {
    title: "Airline Commission Rules",
    description: "Manage commercial commission rules and settlement terms for airline partners.",
    entities: ["Airline", "Rule", "Commission rate", "Effective period", "Settlement policy"],
    workflows: ["Draft rule", "Review impact", "Approve rule", "Publish version"],
  },
  transactions: {
    title: "Platform Transactions",
    description: "Monitor payment activity across bookings, refunds, and partner settlements.",
    entities: ["Transaction", "Booking", "Payment provider", "Currency", "Status"],
    workflows: ["Search payments", "Review failures", "Reconcile records", "Export ledger"],
  },
  settlements: {
    title: "Airline Settlements",
    description: "Track payable balances and settlement cycles for airline partners.",
    entities: ["Airline", "Settlement period", "Gross amount", "Fees", "Net payable"],
    workflows: ["Review statement", "Approve settlement", "Mark paid", "Export statement"],
  },
  disputes: {
    title: "Refunds & Chargebacks",
    description: "Manage financial exceptions, refund requests, and payment disputes.",
    entities: ["Case", "Transaction", "Reason", "Evidence", "Resolution"],
    workflows: ["Triage case", "Request evidence", "Approve refund", "Resolve dispute"],
  },
  reports: {
    title: "Platform Reports",
    description: "Build exportable operational and commercial reports from verified platform datasets.",
    entities: ["Report", "Dataset", "Date range", "Owner", "Export format"],
    workflows: ["Choose dataset", "Apply filters", "Generate report", "Schedule export"],
  },
  health: {
    title: "Service Health",
    description: "Monitor the availability and dependencies of FlightHub platform services.",
    entities: ["Service", "Environment", "Health", "Latency", "Dependencies"],
    workflows: ["Review status", "Inspect dependency", "Acknowledge alert", "Open incident"],
  },
  incidents: {
    title: "Incident Management",
    description: "Coordinate, document, and resolve platform-impacting incidents.",
    entities: ["Incident", "Severity", "Owner", "Affected services", "Timeline"],
    workflows: ["Declare incident", "Assign owner", "Post update", "Close incident"],
  },
  settings: {
    title: "Platform Settings",
    description: "Manage controlled global configuration and operational defaults.",
    entities: ["Setting", "Environment", "Value", "Owner", "Version"],
    workflows: ["Propose change", "Review impact", "Approve change", "Publish version"],
  },
  integrations: {
    title: "Integrations",
    description: "Manage external providers, credentials, webhooks, and connection health.",
    entities: ["Provider", "Connection", "Credential reference", "Webhook", "Health"],
    workflows: ["Add provider", "Test connection", "Rotate secret", "Disable integration"],
  },
}

const PlatformModulePlaceholder = ({ module }) => {
  const config = moduleConfig[module] || moduleConfig.health

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <div className="flex flex-col gap-3 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="outline" className="gap-1 rounded-md">
              <CircleDashed className="h-3.5 w-3.5" />
              Backend integration pending
            </Badge>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">{config.title}</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{config.description}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "API source", value: "Not connected", icon: PlugZap },
          { label: "Records", value: "Awaiting backend", icon: Database },
          { label: "Operational state", value: "UI ready", icon: CheckCircle2 },
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
          <CardHeader>
            <CardTitle className="text-base">Data Contract</CardTitle>
          </CardHeader>
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
          <CardHeader>
            <CardTitle className="text-base">Planned Workflows</CardTitle>
          </CardHeader>
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
          This page intentionally does not display fabricated production metrics. Connect the module API before enabling actions.
        </p>
      </div>
    </div>
  )
}

export default PlatformModulePlaceholder
