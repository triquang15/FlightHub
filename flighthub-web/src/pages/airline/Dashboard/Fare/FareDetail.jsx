import { useEffect } from "react";
import { ArrowLeft, Check, CircleDollarSign, Luggage, Pencil, Plane, ShieldCheck, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { clearCurrentFare } from "@/Redux/fare/fareSlice";
import { getOwnedFareById } from "@/Redux/fare/fareThunk";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const benefits = [
  ["Extra seat space", "extraSeatSpace"], ["Preferred seat", "preferredSeatChoice"],
  ["Advance seat selection", "advanceSeatSelection"], ["Seats together", "guaranteedSeatTogether"],
  ["Priority boarding", "priorityBoarding"], ["Priority check-in", "priorityCheckin"],
  ["Fast-track security", "fastTrackSecurity"], ["Complimentary meals", "complimentaryMeals"],
  ["Premium meal choice", "premiumMealChoice"], ["In-flight internet", "inFlightInternet"],
  ["Entertainment", "inFlightEntertainment"], ["Complimentary beverages", "complimentaryBeverages"],
  ["Free date change", "freeDateChange"], ["Partial refund", "partialRefund"],
  ["Full refund", "fullRefund"], ["Lounge access", "loungeAccess"], ["Airport transfer", "airportTransfer"],
];

const FareDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { fare, loading, error } = useSelector((state) => state.fare);

  useEffect(() => {
    dispatch(getOwnedFareById(id));
    return () => dispatch(clearCurrentFare());
  }, [dispatch, id]);

  if (loading && !fare) return <div className="space-y-4"><Skeleton className="h-24" /><Skeleton className="h-64" /></div>;
  if (error || !fare) return (
    <Card><CardContent className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
      <p className="font-medium text-destructive">{error || "Fare not found"}</p>
      <Button variant="outline" onClick={() => navigate("/airline/fares")}><ArrowLeft className="size-4" /> Back to fares</Button>
    </CardContent></Card>
  );

  const total = Number(fare.totalPrice || fare.currentPrice || 0);
  return (
    <div className="space-y-5 pb-8">
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 -ml-3" onClick={() => navigate("/airline/fares")}><ArrowLeft className="size-4" /> Fares</Button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-foreground">{fare.name}</h1>
            <Badge variant="outline">RBD {fare.rbdCode}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{fare.fareLabel || "Published cabin fare"}</p>
        </div>
        <Button onClick={() => navigate(`/airline/fares/${fare.id}/edit`)}><Pencil className="size-4" /> Edit fare</Button>
      </header>

      <section className="grid overflow-hidden rounded-md border border-border bg-card sm:grid-cols-2 lg:grid-cols-4">
        {[["Total price", total], ["Base fare", fare.baseFare], ["Taxes", fare.taxesAndFees], ["Airline fees", fare.airlineFees]].map(([label, value]) => (
          <div key={label} className="border-r border-border p-4 last:border-r-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-2 text-xl font-semibold text-foreground">{money.format(Number(value || 0))}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CircleDollarSign className="size-4" /> Included benefits</CardTitle></CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {benefits.map(([label, key]) => (
              <div key={key} className="flex items-center gap-2 rounded-md border border-border p-3 text-sm">
                {fare[key] ? <Check className="size-4 text-emerald-600" /> : <X className="size-4 text-muted-foreground" />}
                <span className={fare[key] ? "text-foreground" : "text-muted-foreground"}>{label}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Plane className="size-4" /> Inventory reference</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-xs text-muted-foreground">Flight</p><p className="mt-1 font-medium">#{fare.flightId}</p></div>
              <div><p className="text-xs text-muted-foreground">Cabin</p><p className="mt-1 font-medium">{fare.cabinClass?.replaceAll("_", " ") || `#${fare.cabinClassId}`}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="size-4" /> Fare rule</CardTitle></CardHeader>
            <CardContent>
              {fare.fareRules ? (
                <><p className="font-medium">{fare.fareRules.ruleName}</p><Button className="mt-4" variant="outline" onClick={() => navigate(`/airline/fare-rules/${fare.fareRules.id}`)}>View rule</Button></>
              ) : (
                <><p className="text-sm text-muted-foreground">Refund and change conditions are not configured.</p><Button className="mt-4" variant="outline" onClick={() => navigate("/airline/fare-rules/new")}>Create rule</Button></>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Luggage className="size-4" /> Baggage policy</CardTitle></CardHeader>
            <CardContent>
              {fare.baggagePolicy ? (
                <><p className="font-medium">{fare.baggagePolicy.name}</p><Button className="mt-4" variant="outline" onClick={() => navigate(`/airline/baggage-policies/${fare.baggagePolicy.id}/edit`)}>Review policy</Button></>
              ) : (
                <><p className="text-sm text-muted-foreground">No baggage allowance is attached to this fare.</p><Button className="mt-4" variant="outline" onClick={() => navigate("/airline/baggage-policies/new")}>Create policy</Button></>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FareDetail;
