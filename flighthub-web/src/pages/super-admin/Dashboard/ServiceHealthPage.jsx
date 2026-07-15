import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Gauge,
  RefreshCw,
  ServerCog,
  ShieldAlert,
  Terminal,
  XCircle,
} from "lucide-react";

import api from "@/utils/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const serviceGroups = [
  {
    title: "Platform edge",
    services: [
      { name: "API Gateway", port: 8080, endpoint: "/actuator/health", critical: true, liveCheck: true },
      { name: "Config Server", port: 8888, endpoint: "/actuator/health", critical: true },
      { name: "Eureka Registry", port: 8761, endpoint: "/actuator/health", critical: true },
    ],
  },
  {
    title: "Core services",
    services: [
      { name: "User Service", port: 8090, endpoint: "/actuator/health", critical: true },
      { name: "Airline Core", port: 8081, endpoint: "/actuator/health", critical: true },
      { name: "Flight Ops", port: 8084, endpoint: "/actuator/health", critical: true },
      { name: "Booking Service", port: 8083, endpoint: "/actuator/health", critical: true },
    ],
  },
  {
    title: "Commerce services",
    services: [
      { name: "Payment Service", port: 8086, endpoint: "/actuator/health" },
      { name: "Pricing Service", port: 8087, endpoint: "/actuator/health" },
      { name: "Notification Service", port: 8091, endpoint: "/actuator/health" },
    ],
  },
  {
    title: "Inventory services",
    services: [
      { name: "Location Service", port: 8085, endpoint: "/actuator/health" },
      { name: "Ancillary Service", port: 8082, endpoint: "/actuator/health" },
      { name: "Seat Service", port: 8088, endpoint: "/actuator/health" },
      { name: "Media Service", port: 8089, endpoint: "/actuator/health" },
    ],
  },
];

const commands = [
  "microservices/scripts/local-infra.sh status",
  "microservices/scripts/local-infra.sh observability-status",
  "curl http://localhost:8761/actuator/health",
  "curl http://localhost:8080/actuator/health",
  "curl http://localhost:8080/actuator/prometheus",
];

const getHealthStatus = (payload) => payload?.data?.status || payload?.status || "UNKNOWN";

const ServiceHealthPage = () => {
  const [gatewayHealth, setGatewayHealth] = useState(null);
  const [metricsAvailable, setMetricsAvailable] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    const [healthResult, metricsResult] = await Promise.allSettled([
      api.get("/actuator/health"),
      api.get("/actuator/prometheus"),
    ]);

    if (healthResult.status === "fulfilled") {
      setGatewayHealth(getHealthStatus(healthResult.value.data));
    } else {
      setGatewayHealth("DOWN");
      setError(
        healthResult.reason?.response?.data?.message ||
          healthResult.reason?.message ||
          "API Gateway health endpoint is unavailable."
      );
    }

    setMetricsAvailable(metricsResult.status === "fulfilled");
    setLastChecked(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const summary = useMemo(
    () => [
      {
        label: "Gateway",
        value: loading ? "Checking" : gatewayHealth || "Unknown",
        detail: "Live via /actuator/health",
        icon: Activity,
        tone: gatewayHealth === "UP" ? "healthy" : gatewayHealth === "DOWN" ? "critical" : "muted",
      },
      {
        label: "Prometheus endpoint",
        value: loading ? "Checking" : metricsAvailable ? "Available" : "Unavailable",
        detail: "Gateway /actuator/prometheus",
        icon: Gauge,
        tone: metricsAvailable ? "healthy" : "warning",
      },
      {
        label: "Service map",
        value: `${serviceGroups.reduce((total, group) => total + group.services.length, 0)} services`,
        detail: "Ports and health endpoints for local validation",
        icon: ServerCog,
        tone: "muted",
      },
      {
        label: "Last check",
        value: lastChecked ? lastChecked.toLocaleTimeString() : "-",
        detail: "Manual refresh supported",
        icon: Clock,
        tone: "muted",
      },
    ],
    [gatewayHealth, lastChecked, loading, metricsAvailable]
  );

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1 rounded-md">
              <ServerCog className="h-3.5 w-3.5" />
              Service runtime
            </Badge>
            <Badge variant="secondary" className="rounded-md">
              Local + actuator
            </Badge>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Service Health</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Check API Gateway health, actuator metrics readiness, and the expected runtime endpoints for each local FlightHub service.
          </p>
        </div>

        <Button variant="outline" onClick={refresh} disabled={loading}>
          <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
          Refresh gateway
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summary.map((item) => (
          <SummaryCard key={item.label} {...item} />
        ))}
      </div>

      {error && (
        <div className="flex gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-900 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-base">
              <ServerCog className="h-4 w-4 text-primary" />
              Local service map
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-4 lg:grid-cols-2">
            {serviceGroups.map((group) => (
              <div key={group.title} className="rounded-md border border-border">
                <div className="border-b border-border px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">{group.title}</p>
                </div>
                <div className="divide-y divide-border">
                  {group.services.map((service) => (
                    <ServiceRow key={service.name} service={service} gatewayHealth={gatewayHealth} />
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              Production rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {[
              "A runtime service is healthy when actuator health is UP; metrics-capable services should also expose /actuator/prometheus.",
              "Targets can show down while a local service is intentionally stopped.",
              "Kafka and Redis metrics must be read through exporters, not native service ports.",
              "Credentials and provider secrets should stay in environment variables, never in UI state.",
            ].map((rule) => (
              <div key={rule} className="flex gap-3 rounded-md border border-border px-3 py-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <p className="text-sm text-foreground">{rule}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2 text-base">
            <Terminal className="h-4 w-4 text-emerald-600" />
            Verification commands
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 p-4 md:grid-cols-2">
          {commands.map((command) => (
            <code
              key={command}
              className="block overflow-x-auto rounded-md border border-border bg-muted/60 px-3 py-2 text-xs text-foreground"
            >
              {command}
            </code>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

const toneClasses = {
  healthy: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  warning: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300",
  critical: "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-300",
  muted: "border-border bg-muted text-muted-foreground",
};

const SummaryCard = ({ label, value, detail, icon: Icon, tone }) => (
  <Card>
    <CardContent className="flex items-start justify-between gap-4 p-4">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 truncate text-xl font-semibold text-foreground">{value}</p>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{detail}</p>
      </div>
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-md border", toneClasses[tone])}>
        <Icon className="h-5 w-5" />
      </div>
    </CardContent>
  </Card>
);

const ServiceRow = ({ service, gatewayHealth }) => {
  const isGateway = service.liveCheck;
  const isUp = isGateway && gatewayHealth === "UP";
  const isDown = isGateway && gatewayHealth === "DOWN";
  const url = `http://localhost:${service.port}${service.endpoint}`;

  return (
    <div className="flex min-w-0 items-center gap-3 px-4 py-3">
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
          isUp && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
          isDown && "bg-red-500/10 text-red-600 dark:text-red-300",
          !isUp && !isDown && "bg-muted text-muted-foreground"
        )}
      >
        {isUp ? <CheckCircle2 className="h-4 w-4" /> : isDown ? <XCircle className="h-4 w-4" /> : <ServerCog className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-foreground">{service.name}</p>
          {service.critical && (
            <Badge variant="outline" className="rounded-md text-[10px]">
              Critical
            </Badge>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">{url}</p>
      </div>
      <Button variant="ghost" size="icon" asChild title={`Open ${service.name} health endpoint`}>
        <a href={url} target="_blank" rel="noreferrer">
          <ExternalLink className="h-4 w-4" />
        </a>
      </Button>
    </div>
  );
};

export default ServiceHealthPage;
