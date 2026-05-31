import {
  Activity,
  Bell,
  CheckCircle2,
  Clock,
  Database,
  Mail,
  RefreshCw,
  Server,
  ShieldCheck,
  Smartphone,
  XCircle,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const summaryCards = [
  {
    label: "Event Types",
    value: "3",
    detail: "Suspicious login, password reset, booking confirmed",
    icon: Bell,
    className: "bg-blue-50 text-blue-700",
  },
  {
    label: "Delivery Channels",
    value: "2",
    detail: "EMAIL and SMS are modeled by notification-service",
    icon: Zap,
    className: "bg-emerald-50 text-emerald-700",
  },
  {
    label: "Delivery Statuses",
    value: "5",
    detail: "PENDING, PROCESSING, SENT, FAILED, SKIPPED_DUPLICATE",
    icon: Activity,
    className: "bg-amber-50 text-amber-700",
  },
  {
    label: "Admin API",
    value: "Pending",
    detail: "Tracking tables exist; REST endpoints are not exposed yet",
    icon: Server,
    className: "bg-slate-50 text-slate-700",
  },
];

const deliverySamples = [
  {
    eventKey: "auth.password-reset.requested",
    type: "PASSWORD_RESET_REQUESTED",
    channel: "EMAIL",
    recipient: "customer@example.com",
    status: "SENT",
    attempts: 1,
    updatedAt: "May 31, 2026 09:42",
  },
  {
    eventKey: "auth.suspicious-login.detected",
    type: "SUSPICIOUS_LOGIN",
    channel: "EMAIL",
    recipient: "airline-admin@example.com",
    status: "SENT",
    attempts: 1,
    updatedAt: "May 31, 2026 09:11",
  },
  {
    eventKey: "booking.confirmed",
    type: "BOOKING_CONFIRMED",
    channel: "SMS",
    recipient: "+84******678",
    status: "FAILED",
    attempts: 3,
    updatedAt: "May 31, 2026 08:58",
  },
];

const templates = [
  {
    name: "Reset your FlightHub password",
    type: "PASSWORD_RESET_REQUESTED",
    channel: "EMAIL",
    file: "templates/password-reset.html",
    status: "Production ready",
  },
  {
    name: "New sign-in detected",
    type: "SUSPICIOUS_LOGIN",
    channel: "EMAIL",
    file: "templates/suspicious-login.html",
    status: "Production ready",
  },
  {
    name: "Booking confirmation",
    type: "BOOKING_CONFIRMED",
    channel: "EMAIL/SMS",
    file: "Notification listener payload",
    status: "Backend modeled",
  },
];

const channelHealth = [
  {
    name: "Email delivery",
    icon: Mail,
    status: "Configured",
    detail: "SMTP sender is used for password reset and security alerts.",
  },
  {
    name: "SMS delivery",
    icon: Smartphone,
    status: "Modeled",
    detail: "SMS channel exists in backend enum; provider adapter should be verified before live sending.",
  },
  {
    name: "Kafka consumers",
    icon: RefreshCw,
    status: "Retry enabled",
    detail: "Notification listeners support retry and dead-letter handling for failed events.",
  },
  {
    name: "Redis idempotency",
    icon: ShieldCheck,
    status: "Enabled",
    detail: "Duplicate notification deliveries are guarded before processing.",
  },
];

const readinessItems = [
  "notification_events stores each business event.",
  "notification_deliveries tracks channel, recipient, status, attempts, and failure reason.",
  "Kafka retry and DLQ flow is handled in notification-service.",
  "Super Admin read/replay REST endpoints are still needed for live data and manual retry.",
];

const statusClassName = {
  SENT: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-red-100 text-red-800",
  PENDING: "bg-amber-100 text-amber-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  SKIPPED_DUPLICATE: "bg-slate-100 text-slate-800",
  Configured: "bg-emerald-100 text-emerald-800",
  Modeled: "bg-blue-100 text-blue-800",
  "Retry enabled": "bg-amber-100 text-amber-800",
  Enabled: "bg-emerald-100 text-emerald-800",
  "Production ready": "bg-emerald-100 text-emerald-800",
  "Backend modeled": "bg-blue-100 text-blue-800",
};

const StatusBadge = ({ status }) => (
  <Badge className={statusClassName[status] || "bg-slate-100 text-slate-800"}>
    {status}
  </Badge>
);

const SectionHeader = ({ title, description }) => (
  <div className="mb-6">
    <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
    <p className="mt-1 text-sm text-gray-600">{description}</p>
  </div>
);

const Overview = () => (
  <>
    <SectionHeader
      title="Backend-aligned notification operations"
      description="This page reflects the current notification-service capabilities instead of campaign features that do not exist yet."
    />

    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {summaryCards.map((item) => {
        const Icon = item.icon;

        return (
          <div key={item.label} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div className={`rounded-md p-2 ${item.className}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{item.value}</p>
            </div>
            <p className="mt-4 text-sm font-medium text-gray-900">{item.label}</p>
            <p className="mt-1 text-sm text-gray-600">{item.detail}</p>
          </div>
        );
      })}
    </div>

    <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div className="flex items-start gap-3">
        <Database className="mt-0.5 h-5 w-5 text-blue-700" />
        <div>
          <p className="font-medium text-blue-900">Current backend contract</p>
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
            {readinessItems.map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm text-blue-900">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </>
);

const Deliveries = () => (
  <>
    <SectionHeader
      title="Delivery logs"
      description="Designed around notification_events and notification_deliveries. These rows are placeholders until the admin REST API is exposed."
    />

    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-3">Event</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Channel</th>
            <th className="px-4 py-3">Recipient</th>
            <th className="px-4 py-3">Attempts</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {deliverySamples.map((row) => (
            <tr key={`${row.eventKey}-${row.recipient}`}>
              <td className="px-4 py-3 font-medium text-gray-900">{row.eventKey}</td>
              <td className="px-4 py-3 text-gray-600">{row.type}</td>
              <td className="px-4 py-3 text-gray-600">{row.channel}</td>
              <td className="px-4 py-3 text-gray-600">{row.recipient}</td>
              <td className="px-4 py-3 text-gray-600">{row.attempts}</td>
              <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
              <td className="px-4 py-3 text-gray-600">{row.updatedAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
);

const FailedRetry = () => {
  const failedRows = deliverySamples.filter((row) => row.status === "FAILED");

  return (
    <>
      <SectionHeader
        title="Failed deliveries and retry queue"
        description="Retry/DLQ is backend-managed today. Manual replay should be enabled after an admin endpoint is added."
      />

      <div className="space-y-3">
        {failedRows.map((row) => (
          <div key={row.eventKey} className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-700" />
                  <p className="font-medium text-red-950">{row.eventKey}</p>
                </div>
                <p className="mt-1 text-sm text-red-800">
                  {row.channel} delivery to {row.recipient} failed after {row.attempts} attempts.
                </p>
              </div>
              <StatusBadge status={row.status} />
            </div>
          </div>
        ))}

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-5 w-5 text-amber-700" />
            <div>
              <p className="font-medium text-amber-950">Next backend improvement</p>
              <p className="mt-1 text-sm text-amber-800">
                Add Super Admin endpoints for listing failed deliveries, reading failure reasons, and replaying DLQ messages with audit logging.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const Templates = () => (
  <>
    <SectionHeader
      title="Transactional templates"
      description="Templates are mapped to the notification types that currently exist in notification-service."
    />

    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {templates.map((template) => (
        <div key={template.type} className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <Mail className="h-5 w-5 text-blue-700" />
            <StatusBadge status={template.status} />
          </div>
          <p className="mt-4 font-medium text-gray-900">{template.name}</p>
          <p className="mt-2 text-sm text-gray-600">{template.type}</p>
          <p className="mt-1 text-sm text-gray-600">{template.channel}</p>
          <p className="mt-3 rounded-md bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700">
            {template.file}
          </p>
        </div>
      ))}
    </div>
  </>
);

const ChannelHealth = () => (
  <>
    <SectionHeader
      title="Channel health"
      description="Operational view for the delivery dependencies already represented by the backend."
    />

    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {channelHealth.map((channel) => {
        const Icon = channel.icon;

        return (
          <div key={channel.name} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-gray-100 p-2 text-gray-700">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-medium text-gray-900">{channel.name}</p>
              </div>
              <StatusBadge status={channel.status} />
            </div>
            <p className="mt-3 text-sm text-gray-600">{channel.detail}</p>
          </div>
        );
      })}
    </div>
  </>
);

const sectionContent = {
  "notifications-system": <Overview />,
  "notifications-deliveries": <Deliveries />,
  "notifications-failed": <FailedRetry />,
  "notifications-templates": <Templates />,
  "notifications-channels": <ChannelHealth />,
};

const NotificationsManagement = ({ activeSection = "notifications-system" }) => {
  const content = sectionContent[activeSection] || sectionContent["notifications-system"];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-amber-600" />
          Notification Operations
        </CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
};

export default NotificationsManagement;
