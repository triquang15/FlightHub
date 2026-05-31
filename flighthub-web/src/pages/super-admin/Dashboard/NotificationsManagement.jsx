import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Button } from "@/components/ui/button";
import api from "@/utils/api";

const templates = [
  {
    name: "Reset your FlightHub password",
    type: "PASSWORD_RESET_REQUESTED",
    channel: "EMAIL",
    file: "templates/email/password-reset.html",
    status: "Production ready",
  },
  {
    name: "New sign-in detected",
    type: "SUSPICIOUS_LOGIN",
    channel: "EMAIL",
    file: "templates/email/suspicious-login.html",
    status: "Production ready",
  },
  {
    name: "Booking confirmation",
    type: "BOOKING_CONFIRMED",
    channel: "EMAIL/SMS",
    file: "templates/email/booking-confirmation.html",
    status: "Tracked",
  },
];

const channelHealth = [
  {
    name: "Email delivery",
    icon: Mail,
    status: "Configured",
    detail: "SMTP sender is used for password reset, security alerts, and booking confirmations.",
  },
  {
    name: "SMS delivery",
    icon: Smartphone,
    status: "Modeled",
    detail: "SMS channel is tracked and can be retried when Twilio is enabled.",
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
  "Booking, password reset, and suspicious login notifications are tracked.",
  "Super Admin can read delivery logs and retry failed deliveries through /api/notifications/**.",
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
  Tracked: "bg-blue-100 text-blue-800",
};

const StatusBadge = ({ status }) => (
  <Badge className={statusClassName[status] || "bg-slate-100 text-slate-800"}>
    {status || "UNKNOWN"}
  </Badge>
);

const SectionHeader = ({ title, description }) => (
  <div className="mb-6">
    <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
    <p className="mt-1 text-sm text-gray-600">{description}</p>
  </div>
);

const InlineState = ({ loading, error, empty }) => {
  if (loading) {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        Loading notification data...
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        {error}
      </div>
    );
  }
  if (empty) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
        No notification records found yet.
      </div>
    );
  }

  return null;
};

const formatDateTime = (value) => {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const buildSummaryCards = (overview) => [
  {
    label: "Events",
    value: overview?.totalEvents ?? 0,
    detail: "Rows tracked in notification_events",
    icon: Bell,
    className: "bg-blue-50 text-blue-700",
  },
  {
    label: "Deliveries",
    value: overview?.totalDeliveries ?? 0,
    detail: "Rows tracked in notification_deliveries",
    icon: Zap,
    className: "bg-emerald-50 text-emerald-700",
  },
  {
    label: "Failed",
    value: overview?.deliveriesByStatus?.FAILED ?? 0,
    detail: "Deliveries requiring investigation or retry",
    icon: Activity,
    className: "bg-red-50 text-red-700",
  },
  {
    label: "Admin API",
    value: "Live",
    detail: "Gateway route: /api/notifications/**",
    icon: Server,
    className: "bg-slate-50 text-slate-700",
  },
];

const Overview = ({ overview, loading, error }) => {
  const summaryCards = buildSummaryCards(overview);

  return (
    <>
      <SectionHeader
        title="Backend notification operations"
        description="Live operational view backed by notification-service tracking tables."
      />

      <InlineState loading={loading} error={error} />

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
};

const DeliveryTable = ({ rows }) => (
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
        {rows.map((row) => (
          <tr key={row.id}>
            <td className="px-4 py-3 font-medium text-gray-900">{row.eventKey}</td>
            <td className="px-4 py-3 text-gray-600">{row.type}</td>
            <td className="px-4 py-3 text-gray-600">{row.channel}</td>
            <td className="px-4 py-3 text-gray-600">{row.recipient}</td>
            <td className="px-4 py-3 text-gray-600">{row.attempts}</td>
            <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
            <td className="px-4 py-3 text-gray-600">{formatDateTime(row.updatedAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Deliveries = ({ deliveries, loading, error }) => (
  <>
    <SectionHeader
      title="Delivery logs"
      description="Live records from notification_events and notification_deliveries."
    />
    <InlineState loading={loading} error={error} empty={!loading && !error && deliveries.length === 0} />
    {!loading && !error && deliveries.length > 0 && <DeliveryTable rows={deliveries} />}
  </>
);

const FailedRetry = ({ failedDeliveries, loading, error, onRetry, retryingId }) => (
  <>
    <SectionHeader
      title="Failed deliveries and retry queue"
      description="Retry failed deliveries using the saved notification event payload."
    />

    <InlineState loading={loading} error={error} empty={!loading && !error && failedDeliveries.length === 0} />

    <div className="space-y-3">
      {failedDeliveries.map((row) => (
        <div key={row.id} className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-700" />
                <p className="font-medium text-red-950">{row.eventKey}</p>
              </div>
              <p className="mt-1 text-sm text-red-800">
                {row.channel} delivery to {row.recipient} failed after {row.attempts} attempt(s).
              </p>
              {row.lastError && <p className="mt-1 text-xs text-red-700">{row.lastError}</p>}
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={row.status} />
              <Button
                size="sm"
                onClick={() => onRetry(row.id)}
                disabled={retryingId === row.id}
              >
                {retryingId === row.id ? "Retrying..." : "Retry"}
              </Button>
            </div>
          </div>
        </div>
      ))}

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 h-5 w-5 text-amber-700" />
          <div>
            <p className="font-medium text-amber-950">Retry behavior</p>
            <p className="mt-1 text-sm text-amber-800">
              Manual retry rehydrates the original Kafka payload from notification_events and sends via the matching EMAIL/SMS channel.
            </p>
          </div>
        </div>
      </div>
    </div>
  </>
);

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
      description="Operational view for the delivery dependencies represented by the backend."
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

const NotificationsManagement = ({ activeSection = "notifications-system" }) => {
  const [overview, setOverview] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [failedDeliveries, setFailedDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryingId, setRetryingId] = useState(null);

  const loadNotificationData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [overviewRes, deliveriesRes, failedRes] = await Promise.all([
        api.get("/api/notifications/overview"),
        api.get("/api/notifications/deliveries", { params: { page: 0, size: 20 } }),
        api.get("/api/notifications/deliveries/failed", { params: { page: 0, size: 20 } }),
      ]);

      setOverview(overviewRes.data.data);
      setDeliveries(deliveriesRes.data.data?.content || []);
      setFailedDeliveries(failedRes.data.data?.content || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load notification data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadNotificationData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadNotificationData]);

  const handleRetry = useCallback(async (deliveryId) => {
    setRetryingId(deliveryId);
    setError("");

    try {
      await api.post(`/api/notifications/deliveries/${deliveryId}/retry`);
      await loadNotificationData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to retry notification delivery.");
    } finally {
      setRetryingId(null);
    }
  }, [loadNotificationData]);

  const sectionContent = useMemo(() => ({
    "notifications-system": <Overview overview={overview} loading={loading} error={error} />,
    "notifications-deliveries": <Deliveries deliveries={deliveries} loading={loading} error={error} />,
    "notifications-failed": (
      <FailedRetry
        failedDeliveries={failedDeliveries}
        loading={loading}
        error={error}
        onRetry={handleRetry}
        retryingId={retryingId}
      />
    ),
    "notifications-templates": <Templates />,
    "notifications-channels": <ChannelHealth />,
  }), [deliveries, error, failedDeliveries, handleRetry, loading, overview, retryingId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-amber-600" />
          Notification Operations
        </CardTitle>
      </CardHeader>
      <CardContent>{sectionContent[activeSection] || sectionContent["notifications-system"]}</CardContent>
    </Card>
  );
};

export default NotificationsManagement;
