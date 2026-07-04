import { useEffect } from "react";
import { ArrowLeft, Briefcase, CalendarClock, Luggage, Pencil, ShieldCheck } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { clearBaggagePolicyError, clearCurrentBaggagePolicy } from "@/Redux/baggagePolicy/baggagePolicySlice";
import { getPolicyById } from "@/Redux/baggagePolicy/baggagePolicyThunk";

const formatDateTime = (value) =>
  value
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
    : "Not available";
const formatKg = (value) => (Number(value) > 0 ? `${Number(value).toLocaleString("en-US")} kg` : "Not included");
const formatPieces = (value) => `${Number(value || 0)} pc${Number(value || 0) === 1 ? "" : "s"}`;

const AllowancePanel = ({ icon: Icon, title, pieces, maxWeight, perPiece, dimension }) => (
  <section className="rounded-md border border-border bg-card p-4 sm:p-5">
    <h2 className="flex items-center gap-2 font-semibold text-foreground">
      <Icon className="size-4" />
      {title}
    </h2>
    <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm">
      <div>
        <dt className="text-xs text-muted-foreground">Pieces</dt>
        <dd className="mt-1 font-medium text-foreground">{formatPieces(pieces)}</dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Total weight</dt>
        <dd className="mt-1 font-medium text-foreground">{formatKg(maxWeight)}</dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Weight per piece</dt>
        <dd className="mt-1 font-medium text-foreground">{formatKg(perPiece)}</dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Max dimension</dt>
        <dd className="mt-1 font-medium text-foreground">{dimension ? `${dimension} cm` : "Not set"}</dd>
      </div>
    </dl>
  </section>
);

const BaggagePolicyDetail = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { policy, loading, error } = useSelector((state) => state.baggagePolicy);

  useEffect(() => {
    dispatch(clearBaggagePolicyError());
    dispatch(getPolicyById(id));
    return () => {
      dispatch(clearCurrentBaggagePolicy());
      dispatch(clearBaggagePolicyError());
    };
  }, [dispatch, id]);

  if (loading && !policy) {
    return <div className="space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-48 w-full" /><Skeleton className="h-48 w-full" /></div>;
  }

  if (error || !policy) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center rounded-md border border-border bg-card p-6 text-center">
        <p className="font-medium text-foreground">Baggage policy unavailable</p>
        <p className="mt-1 text-sm text-muted-foreground">{error || "This policy no longer exists."}</p>
        <Button className="mt-4" variant="outline" onClick={() => navigate("/airline/baggage-policies")}>
          <ArrowLeft className="size-4" /> Back to policies
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" aria-label="Back to baggage policies" onClick={() => navigate("/airline/baggage-policies")}>
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <p className="text-sm font-medium text-primary">Fare #{policy.fareId}</p>
            <h1 className="mt-1 truncate text-2xl font-semibold text-foreground">{policy.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{policy.description || `Policy ID #${policy.id}`}</p>
          </div>
        </div>
        <Button onClick={() => navigate(`/airline/baggage-policies/${policy.id}/edit`)}>
          <Pencil className="size-4" /> Edit policy
        </Button>
      </header>

      <section className="grid overflow-hidden rounded-md border border-border bg-card sm:grid-cols-3">
        <div className="border-b border-border p-4 sm:border-b-0 sm:border-r">
          <p className="flex items-center gap-2 text-xs text-muted-foreground"><Luggage className="size-4" /> Assigned fare</p>
          <p className="mt-2 font-semibold text-foreground">Fare #{policy.fareId}</p>
        </div>
        <div className="border-b border-border p-4 sm:border-b-0 sm:border-r">
          <p className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarClock className="size-4" /> Created</p>
          <p className="mt-2 text-sm font-medium text-foreground">{formatDateTime(policy.createdAt)}</p>
        </div>
        <div className="p-4">
          <p className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4" /> Benefits</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant={policy.priorityBaggage ? "default" : "secondary"}>{policy.priorityBaggage ? "Priority baggage" : "No priority"}</Badge>
            <Badge variant={policy.extraBaggageAllowance ? "outline" : "secondary"}>{policy.extraBaggageAllowance ? "Extra baggage allowed" : "Standard allowance"}</Badge>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <AllowancePanel
          icon={Briefcase}
          title="Cabin baggage"
          pieces={policy.cabinBaggagePieces}
          maxWeight={policy.cabinBaggageMaxWeight}
          perPiece={policy.cabinBaggageWeightPerPiece}
          dimension={policy.cabinBaggageMaxDimension}
        />
        <AllowancePanel
          icon={Luggage}
          title="Checked baggage"
          pieces={policy.checkInBaggagePieces}
          maxWeight={policy.checkInBaggageMaxWeight}
          perPiece={policy.checkInBaggageWeightPerPiece}
        />
      </div>
    </div>
  );
};

export default BaggagePolicyDetail;
