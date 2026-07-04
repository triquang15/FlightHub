import { useEffect } from "react";
import { ArrowLeft, ArrowRightLeft, CalendarClock, CircleDollarSign, Pencil, ShieldCheck } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { clearCurrentFareRule, clearFareRulesError } from "@/Redux/fareRules/fareRulesSlice";
import { getFareRuleById } from "@/Redux/fareRules/fareRulesThunk";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const formatFee = (value) => (Number(value) > 0 ? currency.format(value) : "Free");
const formatDateTime = (value) => value
  ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
  : "Not available";

const PolicyPanel = ({ icon: Icon, title, enabled, fee, deadline, deadlineLabel }) => (
  <section className="rounded-md border border-border bg-card p-4 sm:p-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="flex items-center gap-2 font-semibold text-foreground"><Icon className="size-4" /> {title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">Customer-facing conditions applied during purchase and servicing.</p>
      </div>
      <Badge variant={enabled ? "default" : "secondary"}>{enabled ? "Allowed" : "Not allowed"}</Badge>
    </div>
    <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4">
      <div>
        <dt className="text-xs text-muted-foreground">Service fee</dt>
        <dd className="mt-1 font-medium text-foreground">{enabled ? formatFee(fee) : "N/A"}</dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Latest request</dt>
        <dd className="mt-1 font-medium text-foreground">{enabled ? deadlineLabel(deadline) : "N/A"}</dd>
      </div>
    </dl>
  </section>
);

const FareRulesDetail = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentFareRule: rule, loading, error } = useSelector((state) => state.fareRules);

  useEffect(() => {
    dispatch(clearFareRulesError());
    dispatch(getFareRuleById(id));
    return () => {
      dispatch(clearCurrentFareRule());
      dispatch(clearFareRulesError());
    };
  }, [dispatch, id]);

  if (loading && !rule) {
    return <div className="space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-48 w-full" /><Skeleton className="h-48 w-full" /></div>;
  }

  if (error || !rule) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center rounded-md border border-border bg-card p-6 text-center">
        <p className="font-medium text-foreground">Fare rule unavailable</p>
        <p className="mt-1 text-sm text-muted-foreground">{error || "This rule no longer exists."}</p>
        <Button className="mt-4" variant="outline" onClick={() => navigate("/airline/fare-rules")}><ArrowLeft className="size-4" /> Back to rules</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" aria-label="Back to fare rules" onClick={() => navigate("/airline/fare-rules")}>
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <p className="text-sm font-medium text-primary">Fare #{rule.fareId}</p>
            <h1 className="mt-1 truncate text-2xl font-semibold text-foreground">{rule.ruleName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Policy ID #{rule.id}</p>
          </div>
        </div>
        <Button onClick={() => navigate(`/airline/fare-rules/${rule.id}/edit`)}><Pencil className="size-4" /> Edit rule</Button>
      </header>

      <section className="grid overflow-hidden rounded-md border border-border bg-card sm:grid-cols-3">
        <div className="border-b border-border p-4 sm:border-b-0 sm:border-r">
          <p className="flex items-center gap-2 text-xs text-muted-foreground"><CircleDollarSign className="size-4" /> Assigned fare</p>
          <p className="mt-2 font-semibold text-foreground">Fare #{rule.fareId}</p>
        </div>
        <div className="border-b border-border p-4 sm:border-b-0 sm:border-r">
          <p className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarClock className="size-4" /> Created</p>
          <p className="mt-2 text-sm font-medium text-foreground">{formatDateTime(rule.createdAt)}</p>
        </div>
        <div className="p-4">
          <p className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarClock className="size-4" /> Last updated</p>
          <p className="mt-2 text-sm font-medium text-foreground">{formatDateTime(rule.updatedAt)}</p>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <PolicyPanel
          icon={ShieldCheck}
          title="Refund policy"
          enabled={rule.isRefundable}
          fee={rule.cancellationFee}
          deadline={rule.refundDeadlineDays}
          deadlineLabel={(value) => `${value ?? 0} days before departure`}
        />
        <PolicyPanel
          icon={ArrowRightLeft}
          title="Change policy"
          enabled={rule.isChangeable}
          fee={rule.changeFee}
          deadline={rule.changeDeadlineHours}
          deadlineLabel={(value) => `${value ?? 0} hours before departure`}
        />
      </div>
    </div>
  );
};

export default FareRulesDetail;
