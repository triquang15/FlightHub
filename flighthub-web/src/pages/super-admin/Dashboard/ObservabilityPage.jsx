import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Clock,
  DatabaseZap,
  ExternalLink,
  FileSearch,
  Gauge,
  KeyRound,
  LineChart,
  RefreshCw,
  Route,
  ServerCog,
  ShieldAlert,
  Terminal,
} from "lucide-react";

import api from "@/utils/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const grafanaUrl = import.meta.env.VITE_GRAFANA_URL || "http://localhost:3001";
const prometheusUrl = import.meta.env.VITE_PROMETHEUS_URL || "http://localhost:9090";
const lokiUrl = import.meta.env.VITE_LOKI_URL || "http://localhost:3100";
const alertmanagerUrl = import.meta.env.VITE_ALERTMANAGER_URL || "http://localhost:9093";
const elasticsearchUrl = import.meta.env.VITE_ELASTICSEARCH_URL || "http://localhost:9200";
const kibanaUrl = import.meta.env.VITE_KIBANA_URL || "http://localhost:5601";

const buildGrafanaExploreUrl = (datasourceUid, expr) => {
  const panes = {
    A: {
      datasource: datasourceUid,
      queries: [{ refId: "A", datasource: { uid: datasourceUid }, expr }],
      range: { from: "now-1h", to: "now" },
    },
  };

  return `${grafanaUrl}/explore?orgId=1&schemaVersion=1&panes=${encodeURIComponent(JSON.stringify(panes))}`;
};

const toolLinks = [
  {
    id: "grafana",
    label: "Grafana Overview",
    description: "FlightHub dashboard with service scrape health, throughput, and latency panels.",
    url: `${grafanaUrl}/d/flighthub-overview/flighthub-overview?orgId=1&refresh=30s`,
    icon: BarChart3,
    status: import.meta.env.VITE_GRAFANA_URL ? "Configured" : "Local default",
  },
  {
    id: "prometheus",
    label: "Prometheus Targets",
    description: "Scrape status for gateway, registry, config server, and business services.",
    url: `${prometheusUrl}/targets?search=flighthub-host-services`,
    icon: LineChart,
    status: import.meta.env.VITE_PROMETHEUS_URL ? "Configured" : "Local default",
  },
  {
    id: "loki",
    label: "Loki Logs",
    description: "Open Grafana Explore against the Loki data source for traceId and service log searches.",
    url: buildGrafanaExploreUrl("Loki", '{service=~".+"}'),
    icon: FileSearch,
    status: import.meta.env.VITE_LOKI_URL || import.meta.env.VITE_GRAFANA_URL ? "Configured" : "Local default",
  },
  {
    id: "alertmanager",
    label: "Alertmanager Alerts",
    description: "Alert routing and acknowledgement for platform incidents.",
    url: `${alertmanagerUrl}/#/alerts`,
    icon: ShieldAlert,
    status: import.meta.env.VITE_ALERTMANAGER_URL ? "Configured" : "Local default",
  },
  {
    id: "elasticsearch",
    label: "Elasticsearch Health",
    description: "Cluster health endpoint for structured operational log storage.",
    url: `${elasticsearchUrl}/_cluster/health?pretty`,
    icon: FileSearch,
    status: import.meta.env.VITE_ELASTICSEARCH_URL ? "Configured" : "Local default",
  },
  {
    id: "kibana",
    label: "Kibana Discover",
    description: "Explore Elasticsearch indices and build ad-hoc operational log searches.",
    url: `${kibanaUrl}/app/discover`,
    icon: BarChart3,
    status: import.meta.env.VITE_KIBANA_URL ? "Configured" : "Local default",
  },
  {
    id: "loki-api",
    label: "Loki API",
    description: "Raw Loki API endpoint for version/build checks and low-level diagnostics.",
    url: `${lokiUrl}/loki/api/v1/status/buildinfo`,
    icon: Gauge,
    status: import.meta.env.VITE_LOKI_URL ? "Configured" : "Local default",
  },
];

const credentialPolicy = [
  {
    label: "Grafana admin",
    keys: ["GRAFANA_ADMIN_USER", "GRAFANA_ADMIN_PASSWORD"],
    detail: "Stored in .env.local or deployment secrets. The UI never renders the password value.",
  },
  {
    label: "Frontend shortcuts",
    keys: ["VITE_GRAFANA_URL", "VITE_PROMETHEUS_URL", "VITE_LOKI_URL", "VITE_ELASTICSEARCH_URL", "VITE_KIBANA_URL"],
    detail: "Optional links used by the admin console to open external tools.",
  },
  {
    label: "Alert routing",
    keys: ["ALERTMANAGER_HOST_PORT", "VITE_ALERTMANAGER_URL"],
    detail: "Local defaults are safe for development; production routing belongs in secret/config management.",
  },
];

const workflows = [
  {
    title: "Investigate failed request",
    icon: FileSearch,
    steps: ["Copy traceId from UI/API logs", "Open Loki Logs in Grafana Explore", "Search the traceId", "Check gateway status and downstream response"],
  },
  {
    title: "Check service availability",
    icon: ServerCog,
    steps: ["Open Prometheus Targets", "Confirm service scrape is UP", "Call actuator health if a target is down", "Restart local service if missing"],
  },
  {
    title: "Review latency spike",
    icon: Gauge,
    steps: ["Open Grafana latency panel", "Compare gateway vs downstream latency", "Inspect circuit breaker events", "Create incident if user-facing"],
  },
];

const commands = [
  "microservices/scripts/local-infra.sh observability-up",
  "microservices/scripts/local-infra.sh observability-status",
  "microservices/scripts/local-infra.sh status",
  "docker exec gds-redis redis-cli ping",
  "docker exec gds-redis redis-cli --scan --pattern 'jwt:blacklist:*' | head",
  "docker exec gds-redis redis-cli --scan --pattern 'notification:*' | head",
  "curl http://localhost:9090/api/v1/targets?state=active",
  "curl http://localhost:3100/loki/api/v1/status/buildinfo",
  "curl http://localhost:9200/_cluster/health?pretty",
];

const getHealthStatus = (payload) => payload?.data?.status || payload?.status || "UNKNOWN";

const ObservabilityPage = () => {
  const [gatewayHealth, setGatewayHealth] = useState(null);
  const [gatewayError, setGatewayError] = useState("");
  const [metricsAvailable, setMetricsAvailable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setGatewayError("");

    const [healthResult, metricsResult] = await Promise.allSettled([
      api.get("/actuator/health"),
      api.get("/actuator/metrics"),
    ]);

    if (healthResult.status === "fulfilled") {
      setGatewayHealth(getHealthStatus(healthResult.value.data));
    } else {
      setGatewayHealth("DOWN");
      setGatewayError(
        healthResult.reason?.response?.data?.message ||
          healthResult.reason?.message ||
          "Gateway health endpoint is unavailable."
      );
    }

    setMetricsAvailable(metricsResult.status === "fulfilled");
    setLastChecked(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const healthTone = gatewayHealth === "UP" ? "healthy" : gatewayHealth === "DOWN" ? "critical" : "muted";
  const configuredTools = toolLinks.filter((tool) => tool.status === "Configured").length;
  const stackSummary = useMemo(
    () => [
      {
        label: "Gateway health",
        value: loading ? "Checking" : gatewayHealth || "Unknown",
        detail: gatewayError || "Live check from /actuator/health",
        icon: Activity,
        tone: healthTone,
      },
      {
        label: "Metrics endpoint",
        value: loading ? "Checking" : metricsAvailable ? "Available" : "Not exposed",
        detail: "Gateway /actuator/metrics",
        icon: Gauge,
        tone: metricsAvailable ? "healthy" : "warning",
      },
      {
        label: "External tools",
        value: `${configuredTools}/${toolLinks.length} configured`,
        detail: "Grafana, Prometheus, Loki, Alertmanager, Elasticsearch, Kibana",
        icon: Route,
        tone: configuredTools > 0 ? "healthy" : "muted",
      },
      {
        label: "Redis policy",
        value: "Fail-closed",
        detail: "Gateway rate limit and token blacklist use Redis with production-safe defaults",
        icon: DatabaseZap,
        tone: "healthy",
      },
      {
        label: "Last check",
        value: lastChecked ? lastChecked.toLocaleTimeString() : "-",
        detail: "Manual refresh supported",
        icon: Clock,
        tone: "muted",
      },
    ],
    [configuredTools, gatewayError, gatewayHealth, healthTone, lastChecked, loading, metricsAvailable]
  );

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1 rounded-md">
              <Activity className="h-3.5 w-3.5" />
              Platform observability
            </Badge>
            <Badge variant="secondary" className="rounded-md">
              No fabricated metrics
            </Badge>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Observability Tool Hub
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Open the monitoring stack, review data sources, and keep access policy clear. Use Service Health for runtime status checks.
          </p>
        </div>

        <Button variant="outline" onClick={refresh} disabled={loading}>
          <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
          Refresh health
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {stackSummary.map((item) => (
          <SummaryCard key={item.label} {...item} />
        ))}
      </div>

      {gatewayError && (
        <div className="flex gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-sm">{gatewayError}</p>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-base">
              <ExternalLink className="h-4 w-4 text-primary" />
              Observability tools
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 p-4 md:grid-cols-2">
            {toolLinks.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4 text-blue-600" />
              Access and credential policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {credentialPolicy.map((item) => (
              <div key={item.label} className="rounded-md border border-border p-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.keys.map((key) => (
                    <code key={key} className="rounded-md border border-border bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                      {key}
                    </code>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{item.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {workflows.map((workflow) => (
          <WorkflowCard key={workflow.title} workflow={workflow} />
        ))}
      </div>

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2 text-base">
            <DatabaseZap className="h-4 w-4 text-emerald-600" />
            Redis operating boundary
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 p-4 md:grid-cols-3">
          {[
            {
              title: "Gateway security",
              detail: "Rate limits and JWT blacklist are Redis-backed and fail closed by default.",
            },
            {
              title: "Read caches",
              detail: "Airline, Location, Pricing, and Flight Ops caches are disposable and TTL-bound.",
            },
            {
              title: "Notification idempotency",
              detail: "Processing and sent keys suppress duplicate Kafka delivery attempts.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-md border border-border p-3">
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2 text-base">
            <Terminal className="h-4 w-4 text-emerald-600" />
            Local runbook commands
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

const ToolCard = ({ tool }) => {
  const Icon = tool.icon;
  const isConfigured = tool.status === "Configured";

  return (
    <div className="flex min-w-0 flex-col gap-4 rounded-md border border-border p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground">{tool.label}</p>
            <Badge
              variant="outline"
              className={cn(
                "rounded-md text-[10px]",
                isConfigured
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300"
              )}
            >
              {tool.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{tool.description}</p>
        </div>
      </div>
      <Button variant="outline" className="justify-between" asChild>
        <a href={tool.url} target="_blank" rel="noreferrer">
          Open {tool.label}
          <ExternalLink className="h-4 w-4" />
        </a>
      </Button>
    </div>
  );
};

const WorkflowCard = ({ workflow }) => {
  const Icon = workflow.icon;

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-primary" />
          {workflow.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        {workflow.steps.map((step, index) => (
          <div key={step} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
              {index + 1}
            </span>
            <p className="text-sm text-foreground">{step}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ObservabilityPage;
