import {
  Bell,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Gauge,
  KeyRound,
  Mail,
  PlugZap,
  RefreshCw,
  ShieldCheck,
  Webhook,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getRuntimeConfig } from "@/utils/runtimeConfig";

const integrationGroups = [
  {
    title: "Payments",
    description: "Checkout providers and webhook verification used by booking payment flows.",
    icon: CreditCard,
    providers: [
      {
        name: "Stripe",
        status: "Environment managed",
        health: "Ready when keys are present",
        envKeys: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
        runbook: "Create checkout session, verify webhook signature, confirm payment before ticket issue.",
      },
      {
        name: "PayPal",
        status: "Environment managed",
        health: "Ready when keys are present",
        envKeys: ["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET", "PAYPAL_WEBHOOK_ID"],
        runbook: "Create order, capture payment, verify webhook event with provider webhook ID.",
      },
    ],
  },
  {
    title: "Notifications",
    description: "Email, SMS, and Kafka event delivery used by booking and security flows.",
    icon: Bell,
    providers: [
      {
        name: "SMTP Email",
        status: "Environment managed",
        health: "Check notification-service",
        envKeys: ["MAIL_HOST", "MAIL_USERNAME", "MAIL_PASSWORD", "MAIL_FROM"],
        runbook: "Render template, persist delivery attempt, retry failed sends, route dead letters.",
      },
      {
        name: "SMS Provider",
        status: "Optional",
        health: "Disabled until provider keys exist",
        envKeys: ["SMS_PROVIDER", "SMS_API_KEY", "SMS_SENDER_ID"],
        runbook: "Keep SMS optional and fall back to email for traveler-critical notifications.",
      },
    ],
  },
  {
    title: "Observability",
    description: "Operational tools for metrics, logs, alerts, and search.",
    icon: Gauge,
    providers: [
      {
        name: "Grafana",
        status: "Environment managed",
        health: "Local default available",
        envKeys: ["GRAFANA_ADMIN_USER", "GRAFANA_ADMIN_PASSWORD", "VITE_GRAFANA_URL"],
        runbook: "Use env-managed credentials. Rotate password through .env.local and recreate Grafana data volume when needed.",
      },
      {
        name: "Prometheus, Loki, Elastic",
        status: "Local stack",
        health: "Managed by docker compose profile",
        envKeys: ["VITE_PROMETHEUS_URL", "VITE_LOKI_URL", "VITE_ELASTICSEARCH_URL", "VITE_KIBANA_URL"],
        runbook: "Prometheus scrapes actuator endpoints. Promtail ships Docker logs to Loki. Elastic/Kibana are available for indexed search.",
      },
    ],
  },
];

const operationalRules = [
  {
    title: "No secrets in browser",
    description: "The admin UI shows provider status and env key names only. Secret values must stay server-side.",
    icon: ShieldCheck,
  },
  {
    title: "Webhook verification is mandatory",
    description: "Stripe and PayPal callbacks must verify provider signatures before changing booking or payment state.",
    icon: Webhook,
  },
  {
    title: "Rotate by environment",
    description: "Credential rotation should be done through .env.local, deployment secrets, or provider consoles.",
    icon: KeyRound,
  },
  {
    title: "Observe before retry",
    description: "Failed delivery or payment jobs should be inspected in logs/metrics before manual retry.",
    icon: RefreshCw,
  },
];

const IntegrationManagementPage = () => {
  const configuredFrontendLinks = [
    getRuntimeConfig("VITE_GRAFANA_URL"),
    getRuntimeConfig("VITE_PROMETHEUS_URL"),
    getRuntimeConfig("VITE_LOKI_URL"),
    getRuntimeConfig("VITE_ALERTMANAGER_URL"),
    getRuntimeConfig("VITE_ELASTICSEARCH_URL"),
    getRuntimeConfig("VITE_KIBANA_URL"),
  ].filter(Boolean).length;

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1 rounded-md">
              <PlugZap className="h-3.5 w-3.5" />
              Provider configuration
            </Badge>
            <Badge variant="secondary" className="rounded-md">
              Secrets hidden
            </Badge>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Integrations</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Review external providers, required environment keys, webhook responsibilities, and operational ownership without exposing secret values.
          </p>
        </div>

        <Button variant="outline" asChild>
          <a href="/super-admin/operations/observability">
            Open observability
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <IntegrationSummaryCard
          label="Provider groups"
          value={integrationGroups.length}
          detail="Payments, notifications, observability"
          icon={PlugZap}
          tone="primary"
        />
        <IntegrationSummaryCard
          label="Frontend tool URLs"
          value={`${configuredFrontendLinks}/6`}
          detail="Optional VITE_* links for admin shortcuts"
          icon={ExternalLink}
          tone={configuredFrontendLinks ? "healthy" : "muted"}
        />
        <IntegrationSummaryCard
          label="Secret policy"
          value="Server-side"
          detail="UI never displays credential values"
          icon={ShieldCheck}
          tone="healthy"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {integrationGroups.map((group) => (
          <ProviderGroup key={group.title} group={group} />
        ))}
      </div>

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Production integration rules
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
          {operationalRules.map((rule) => {
            const Icon = rule.icon;
            return (
              <div key={rule.title} className="rounded-md border border-border p-4">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="font-semibold text-foreground">{rule.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{rule.description}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

const summaryTone = {
  primary: "bg-primary/10 text-primary",
  healthy: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  muted: "bg-muted text-muted-foreground",
};

const IntegrationSummaryCard = ({ label, value, detail, icon: Icon, tone }) => (
  <Card>
    <CardContent className="flex items-start gap-4 p-4">
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-md", summaryTone[tone])}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </div>
    </CardContent>
  </Card>
);

const ProviderGroup = ({ group }) => {
  const Icon = group.icon;

  return (
    <Card className="min-w-0">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-primary" />
          {group.title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{group.description}</p>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        {group.providers.map((provider) => (
          <div key={provider.name} className="rounded-md border border-border p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-foreground">{provider.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{provider.health}</p>
              </div>
              <Badge variant="outline" className="rounded-md">
                {provider.status}
              </Badge>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {provider.envKeys.map((key) => (
                <code key={key} className="rounded-md border border-border bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                  {key}
                </code>
              ))}
            </div>

            <div className="mt-3 flex gap-2 rounded-md bg-muted/60 px-3 py-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{provider.runbook}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default IntegrationManagementPage;
