import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bell,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Database,
  Filter,
  Mail,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Smartphone,
  XCircle,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  SENT: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  FAILED: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  PROCESSING: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  SKIPPED_DUPLICATE: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  Configured: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
  Modeled: "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
  "Retry enabled": "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  Enabled: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
  "Production ready": "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
  Tracked: "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
};

const StatusBadge = ({ status }) => (
  <Badge className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClassName[status] || "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"}`}>
    {status || "UNKNOWN"}
  </Badge>
);

const channelMeta = {
  EMAIL: {
    icon: Mail,
    label: "Email",
    avatarClassName: "bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300",
    badgeClassName: "bg-indigo-50 text-indigo-700 border border-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300",
  },
  SMS: {
    icon: Smartphone,
    label: "SMS",
    avatarClassName: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300",
    badgeClassName: "bg-emerald-50 text-emerald-700 border border-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
};

const typeLabel = {
  PASSWORD_RESET_REQUESTED: "Password Reset",
  SUSPICIOUS_LOGIN: "Security Alert",
  BOOKING_CONFIRMED: "Booking",
};

const statusDotClassName = {
  SENT: "bg-emerald-500",
  FAILED: "bg-red-500",
  PENDING: "bg-amber-500",
  PROCESSING: "bg-blue-500",
  SKIPPED_DUPLICATE: "bg-slate-400",
};

const tableHeadClassName = "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400";
const MIN_RELOAD_SPINNER_MS = 500;

const wait = (ms) => new Promise((resolve) => {
  window.setTimeout(resolve, ms);
});

const SectionHeader = ({ title, description }) => (
  <div>
    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{description}</p>
  </div>
);

const InlineState = ({ loading, error, empty }) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
        <RefreshCw className="h-8 w-8 animate-spin mb-3 text-indigo-400" />
        <p className="text-sm">Loading notification data...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
        {error}
      </div>
    );
  }
  if (empty) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-400">
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
    className: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  },
  {
    label: "Deliveries",
    value: overview?.totalDeliveries ?? 0,
    detail: "Rows tracked in notification_deliveries",
    icon: Zap,
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  },
  {
    label: "Failed",
    value: overview?.deliveriesByStatus?.FAILED ?? 0,
    detail: "Deliveries requiring investigation or retry",
    icon: Activity,
    className: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300",
  },
  {
    label: "Admin API",
    value: "Live",
    detail: "Gateway route: /api/notifications/**",
    icon: Server,
    className: "bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
];

const NotificationStatsCards = ({ overview }) => {
  const summaryCards = buildSummaryCards(overview);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      {summaryCards.map((item) => {
        const Icon = item.icon;

        return (
          <Card key={item.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 ${item.className}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{item.value}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{item.label}</div>
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-500">{item.detail}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

const NotificationToolbar = ({
  searchQuery,
  onSearchChange,
  showFilters,
  onToggleFilters,
  onRefresh,
  lastUpdated,
  loading,
}) => (
  <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
    <div className="flex flex-1 items-center gap-3">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
        <Input
          placeholder="Search event, recipient, business key..."
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          className="pl-10"
        />
      </div>

      <Button
        variant={showFilters ? "default" : "outline"}
        onClick={onToggleFilters}
        className="flex items-center gap-2"
      >
        <Filter className="h-4 w-4" />
        Filters
      </Button>
    </div>

    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={onRefresh}
        disabled={loading}
        title="Reload notification data"
        aria-label="Reload notification data"
        className="h-10 w-10"
      >
        <RefreshCw className={`h-4 w-4 text-indigo-500 ${loading ? "animate-spin" : ""}`} />
      </Button>

      {lastUpdated && (
        <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
          Updated {lastUpdated}
        </span>
      )}
    </div>
  </div>
);

const NotificationFilters = ({ isVisible, filters, onFiltersChange, onReset }) => {
  if (!isVisible) return null;

  const handleChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value === "all" ? "" : value,
    });
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Status</label>
            <select
              value={filters.status || "all"}
              onChange={(event) => handleChange("status", event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="SENT">Sent</option>
              <option value="FAILED">Failed</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="SKIPPED_DUPLICATE">Skipped duplicate</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Channel</label>
            <select
              value={filters.channel || "all"}
              onChange={(event) => handleChange("channel", event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All channels</option>
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Type</label>
            <select
              value={filters.type || "all"}
              onChange={(event) => handleChange("type", event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All types</option>
              <option value="PASSWORD_RESET_REQUESTED">Password reset</option>
              <option value="SUSPICIOUS_LOGIN">Suspicious login</option>
              <option value="BOOKING_CONFIRMED">Booking confirmed</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button variant="outline" onClick={onReset} className="w-full">
              Reset Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const NotificationPagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  onItemsPerPageChange,
}) => {
  const page = Number(currentPage) || 1;
  const size = Number(itemsPerPage) || 10;
  const total = Number(totalItems) || 0;
  const pages = Math.max(Number(totalPages) || 1, 1);

  const startItem = total === 0 ? 0 : (page - 1) * size + 1;
  const endItem = Math.min(page * size, total);

  const getPageNumbers = () => {
    const result = [];
    const max = 5;
    let start = Math.max(1, page - Math.floor(max / 2));
    let end = Math.min(pages, start + max - 1);

    if (end - start + 1 < max) {
      start = Math.max(1, end - max + 1);
    }

    for (let i = start; i <= end; i += 1) {
      result.push(i);
    }

    return result;
  };

  if (total === 0) return null;

  return (
    <div className="flex flex-col items-center justify-between gap-4 py-4 sm:flex-row">
      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
        <span>
          Showing {startItem} to {endItem} of {total} deliveries
        </span>

        <div className="flex items-center gap-2">
          <span>Rows:</span>
          <Select
            value={String(size)}
            onValueChange={(value) => {
              onItemsPerPageChange(Number(value));
              onPageChange(1);
            }}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(1)} disabled={page === 1}>
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-1">
          {getPageNumbers().map((pageNumber) => (
            <Button
              key={pageNumber}
              variant={page === pageNumber ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(pageNumber)}
              className="w-9"
            >
              {pageNumber}
            </Button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= pages}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => onPageChange(pages)} disabled={page >= pages}>
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const Overview = ({ overview, loading, error }) => {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Backend notification operations"
        description="Live operational view backed by notification-service tracking tables."
      />

      <InlineState loading={loading} error={error} />

      <NotificationStatsCards overview={overview} />

      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Database className="mt-0.5 h-5 w-5 text-blue-700 dark:text-blue-300" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Current backend contract</p>
              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                {readinessItems.map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-300" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const DeliveryTable = ({ rows, loading, error }) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
        <RefreshCw className="h-8 w-8 animate-spin mb-3 text-indigo-400" />
        <p className="text-sm">Loading notification deliveries...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-red-500 dark:text-red-300">
        <XCircle className="mb-3 h-10 w-10 opacity-50" />
        <p className="font-medium">Unable to load notifications</p>
        <p className="mt-1 text-sm">{error}</p>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
        <Bell className="mb-3 h-10 w-10 opacity-40" />
        <p className="font-medium">No notification records found</p>
        <p className="mt-1 text-sm">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table className="w-full text-sm">
        <TableHeader className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
          <TableRow>
            <TableHead className={tableHeadClassName}>
              Delivery
            </TableHead>
            <TableHead className={tableHeadClassName}>
              Type
            </TableHead>
            <TableHead className={tableHeadClassName}>
              Channel
            </TableHead>
            <TableHead className={tableHeadClassName}>
              Recipient
            </TableHead>
            <TableHead className={`${tableHeadClassName} text-center`}>
              Attempts
            </TableHead>
            <TableHead className={tableHeadClassName}>
              Status
            </TableHead>
            <TableHead className={`${tableHeadClassName} text-right`}>
              Updated
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody className="divide-y dark:divide-gray-700">
        {rows.map((row, index) => {
          const channel = channelMeta[row.channel] || channelMeta.EMAIL;
          const ChannelIcon = channel.icon;

          return (
          <TableRow
            key={row.id}
            className="border-l-4 border-l-transparent transition hover:border-l-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30"
          >
            <TableCell className="px-4 py-3">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${channel.avatarClassName}`}>
                  <ChannelIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 dark:text-gray-500">#{index + 1}</span>
                    <p className="max-w-[320px] truncate font-medium text-gray-900 dark:text-gray-100">{row.eventKey}</p>
                  </div>
                  <p className="mt-0.5 max-w-[340px] truncate text-xs text-gray-400 dark:text-gray-500">
                    {row.businessKey || row.deliveryKey}
                  </p>
                </div>
              </div>
            </TableCell>
            <TableCell className="px-4 py-3">
              <div className="space-y-1">
                <Badge className="rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                  {typeLabel[row.type] || row.type}
                </Badge>
                <p className="text-xs text-gray-400 dark:text-gray-500">{row.sourceService || "notification-service"}</p>
              </div>
            </TableCell>
            <TableCell className="px-4 py-3">
              <Badge className={`rounded-full ${channel.badgeClassName}`}>
                {channel.label}
              </Badge>
            </TableCell>
            <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-300">{row.recipient}</TableCell>
            <TableCell className="px-4 py-3 text-center">
              <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-gray-100 px-2 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                {row.attempts}
              </span>
            </TableCell>
            <TableCell className="px-4 py-3">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${statusDotClassName[row.status] || "bg-slate-400"}`} />
                <StatusBadge status={row.status} />
              </div>
            </TableCell>
            <TableCell className="px-4 py-3 text-right text-xs text-gray-500 dark:text-gray-400">{formatDateTime(row.updatedAt)}</TableCell>
          </TableRow>
          );
        })}
        </TableBody>
      </Table>
    </div>
  );
};

const Deliveries = ({
  deliveries,
  loading,
  error,
  pageInfo,
  currentPage,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}) => (
  <div className="space-y-6">
    <SectionHeader
      title="Delivery logs"
      description="Live records from notification_events and notification_deliveries."
    />
    <Card>
      <CardContent className="p-0">
        <DeliveryTable rows={deliveries} loading={loading} error={error} />
        <div className="px-6">
          <NotificationPagination
            currentPage={currentPage}
            totalPages={pageInfo.totalPages}
            totalItems={pageInfo.totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={onPageChange}
            onItemsPerPageChange={onItemsPerPageChange}
          />
        </div>
      </CardContent>
    </Card>
  </div>
);

const FailedRetry = ({
  failedDeliveries,
  loading,
  error,
  onRetry,
  retryingId,
  pageInfo,
  currentPage,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}) => (
  <div className="space-y-6">
    <SectionHeader
      title="Failed deliveries and retry queue"
      description="Retry failed deliveries using the saved notification event payload."
    />

    <Card>
      <CardContent className="p-0">
        <DeliveryTable rows={failedDeliveries} loading={loading} error={error} />
        <div className="px-6">
          <NotificationPagination
            currentPage={currentPage}
            totalPages={pageInfo.totalPages}
            totalItems={pageInfo.totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={onPageChange}
            onItemsPerPageChange={onItemsPerPageChange}
          />
        </div>
        {!loading && !error && failedDeliveries.length > 0 && (
          <div className="border-t px-4 py-3 dark:border-gray-700">
            <div className="space-y-3">
              {failedDeliveries.map((row) => (
                <div key={row.id} className="flex flex-col justify-between gap-3 rounded-lg bg-red-50 p-3 dark:bg-red-950/30 md:flex-row md:items-center">
                  <div className="text-sm text-red-800 dark:text-red-300">
                    <p className="font-medium">{row.eventKey}</p>
                    {row.lastError && <p className="mt-1 text-xs">{row.lastError}</p>}
                  </div>
                  <Button size="sm" onClick={() => onRetry(row.id)} disabled={retryingId === row.id}>
                    {retryingId === row.id ? "Retrying..." : "Retry"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>

      <Card>
        <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 h-5 w-5 text-amber-700 dark:text-amber-300" />
          <div>
            <p className="font-medium text-amber-950 dark:text-amber-200">Retry behavior</p>
            <p className="mt-1 text-sm text-amber-800 dark:text-amber-300/80">
              Manual retry rehydrates the original Kafka payload from notification_events and sends via the matching EMAIL/SMS channel.
            </p>
          </div>
        </div>
        </CardContent>
      </Card>
  </div>
);

const Templates = () => (
  <div className="space-y-6">
    <SectionHeader
      title="Transactional templates"
      description="Templates are mapped to the notification types that currently exist in notification-service."
    />

    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {templates.map((template) => (
        <Card key={template.type}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <Mail className="h-5 w-5 text-blue-700 dark:text-blue-300" />
              <StatusBadge status={template.status} />
            </div>
            <p className="mt-4 font-medium text-gray-900 dark:text-gray-100">{template.name}</p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{template.type}</p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{template.channel}</p>
            <p className="mt-3 rounded-md bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {template.file}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

const ChannelHealth = () => (
  <div className="space-y-6">
    <SectionHeader
      title="Channel health"
      description="Operational view for the delivery dependencies represented by the backend."
    />

    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {channelHealth.map((channel) => {
        const Icon = channel.icon;

        return (
          <Card key={channel.name}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gray-100 p-2 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{channel.name}</p>
                </div>
                <StatusBadge status={channel.status} />
              </div>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{channel.detail}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  </div>
);

const NotificationsManagement = ({ activeSection = "notifications-system" }) => {
  const [overview, setOverview] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [failedDeliveries, setFailedDeliveries] = useState([]);
  const [deliveryPageInfo, setDeliveryPageInfo] = useState({ totalPages: 1, totalItems: 0 });
  const [failedPageInfo, setFailedPageInfo] = useState({ totalPages: 1, totalItems: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryingId, setRetryingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");
  const [reloadSpinning, setReloadSpinning] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const showDataToolbar = activeSection === "notifications-deliveries" || activeSection === "notifications-failed";

  const loadNotificationData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {
        page: currentPage - 1,
        size: itemsPerPage,
        search: searchQuery || undefined,
        status: filters.status || undefined,
        channel: filters.channel || undefined,
        type: filters.type || undefined,
      };

      const failedParams = {
        ...params,
        status: "FAILED",
      };

      const [overviewRes, deliveriesRes, failedRes] = await Promise.all([
        api.get("/api/notifications/overview"),
        api.get("/api/notifications/deliveries", { params }),
        api.get("/api/notifications/deliveries", { params: failedParams }),
      ]);

      const deliveryPage = deliveriesRes.data.data;
      const failedPage = failedRes.data.data;

      setOverview(overviewRes.data.data);
      setDeliveries(deliveryPage?.content || []);
      setFailedDeliveries(failedPage?.content || []);
      setDeliveryPageInfo({
        totalPages: deliveryPage?.totalPages || 1,
        totalItems: deliveryPage?.totalElements || 0,
      });
      setFailedPageInfo({
        totalPages: failedPage?.totalPages || 1,
        totalItems: failedPage?.totalElements || 0,
      });
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load notification data.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, itemsPerPage, searchQuery]);

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

  const handleReload = useCallback(async () => {
    const startedAt = Date.now();
    setReloadSpinning(true);

    try {
      await loadNotificationData();
    } finally {
      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_RELOAD_SPINNER_MS) {
        await wait(MIN_RELOAD_SPINNER_MS - elapsed);
      }
      setReloadSpinning(false);
    }
  }, [loadNotificationData]);

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback((value) => {
    setFilters(value);
    setCurrentPage(1);
  }, []);

  const handleItemsPerPageChange = useCallback((value) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({});
    setSearchQuery("");
    setCurrentPage(1);
  }, []);

  const sectionContent = useMemo(() => ({
    "notifications-system": <Overview overview={overview} loading={loading} error={error} />,
    "notifications-deliveries": (
      <Deliveries
        deliveries={deliveries}
        loading={loading}
        error={error}
        pageInfo={deliveryPageInfo}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={handleItemsPerPageChange}
      />
    ),
    "notifications-failed": (
      <FailedRetry
        failedDeliveries={failedDeliveries}
        loading={loading}
        error={error}
        onRetry={handleRetry}
        retryingId={retryingId}
        pageInfo={failedPageInfo}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={handleItemsPerPageChange}
      />
    ),
    "notifications-templates": <Templates />,
    "notifications-channels": <ChannelHealth />,
  }), [
    currentPage,
    deliveries,
    deliveryPageInfo,
    error,
    failedDeliveries,
    failedPageInfo,
    handleItemsPerPageChange,
    handleRetry,
    itemsPerPage,
    loading,
    overview,
    retryingId,
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Bell className="h-5 w-5 text-amber-600" />
          Notification Operations
        </CardTitle>
      </div>

      {showDataToolbar && (
        <>
          <NotificationToolbar
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
            onRefresh={handleReload}
            lastUpdated={lastUpdated}
            loading={loading || reloadSpinning}
          />

          <NotificationFilters
            isVisible={showFilters}
            filters={filters}
            onFiltersChange={handleFilterChange}
            onReset={resetFilters}
          />
        </>
      )}

      {sectionContent[activeSection] || sectionContent["notifications-system"]}
    </div>
  );
};

export default NotificationsManagement;
