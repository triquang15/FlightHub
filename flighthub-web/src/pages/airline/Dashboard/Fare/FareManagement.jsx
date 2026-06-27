import { useEffect, useMemo, useState } from "react";
import { CircleDollarSign, Eye, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { deleteFare, getOwnerFares } from "@/Redux/fare/fareThunk";
import { getFlightsByAirline } from "@/Redux/flight/flightThunk";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const IconAction = ({ label, icon: Icon, onClick }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button type="button" size="icon" variant="ghost" aria-label={label} onClick={onClick}>
        <Icon className="size-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
);

const Stat = ({ label, value, detail }) => (
  <div className="border-r border-border px-4 py-3 last:border-r-0">
    <p className="text-xs font-medium text-muted-foreground">{label}</p>
    <div className="mt-2 flex items-baseline gap-2">
      <span className="text-2xl font-semibold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{detail}</span>
    </div>
  </div>
);

const FareManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { fares, loading, error } = useSelector((state) => state.fare);
  const flightPayload = useSelector((state) => state.flight.flights);
  const [search, setSearch] = useState("");
  const [flightFilter, setFlightFilter] = useState("all");
  const [fareToDelete, setFareToDelete] = useState(null);

  useEffect(() => {
    dispatch(getOwnerFares());
    dispatch(getFlightsByAirline());
  }, [dispatch]);

  const rows = useMemo(() => (Array.isArray(fares) ? fares : []), [fares]);
  const flights = useMemo(
    () => Array.isArray(flightPayload) ? flightPayload : (flightPayload?.content || []),
    [flightPayload],
  );
  const flightById = useMemo(() => new Map(flights.map((flight) => [String(flight.id), flight])), [flights]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((fare) => {
      const flight = flightById.get(String(fare.flightId));
      const matchesSearch = !query
        || fare.name?.toLowerCase().includes(query)
        || fare.fareLabel?.toLowerCase().includes(query)
        || String(fare.rbdCode || "").toLowerCase().includes(query)
        || flight?.flightNumber?.toLowerCase().includes(query);
      return matchesSearch && (flightFilter === "all" || String(fare.flightId) === flightFilter);
    });
  }, [flightById, flightFilter, rows, search]);

  const averagePrice = rows.length
    ? rows.reduce((sum, fare) => sum + Number(fare.totalPrice || fare.currentPrice || 0), 0) / rows.length
    : 0;
  const configuredPolicies = rows.filter((fare) => fare.fareRulesId || fare.fareRules).length;
  const configuredBaggage = rows.filter((fare) => fare.baggagePolicy).length;

  const confirmDelete = async () => {
    if (!fareToDelete) return;
    try {
      await dispatch(deleteFare(fareToDelete.id)).unwrap();
      toast.success("Fare deleted", { description: `${fareToDelete.name} was removed from future sales.` });
      setFareToDelete(null);
    } catch (deleteError) {
      toast.error("Unable to delete fare", { description: String(deleteError) });
    }
  };

  const flightLabel = (fare) => flightById.get(String(fare.flightId))?.flightNumber || `Flight #${fare.flightId}`;

  return (
    <TooltipProvider>
      <div className="space-y-5 pb-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
              <CircleDollarSign className="size-4" /> Commercial products
            </div>
            <h1 className="text-2xl font-semibold text-foreground">Fares</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Publish cabin prices and track whether each product has sales policies configured.
            </p>
          </div>
          <Button onClick={() => navigate("/airline/fares/new")}><Plus className="size-4" /> Create fare</Button>
        </header>

        <section className="grid overflow-hidden rounded-md border border-border bg-card sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Published fares" value={rows.length} detail="products" />
          <Stat label="Average total" value={money.format(averagePrice)} detail="per fare" />
          <Stat label="Fare rules" value={configuredPolicies} detail={`of ${rows.length}`} />
          <Stat label="Baggage policies" value={configuredBaggage} detail={`of ${rows.length}`} />
        </section>

        <section className="overflow-hidden rounded-md border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Fare register</h2>
              <p className="text-xs text-muted-foreground">Prices include base fare, taxes and airline fees.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search fare or flight" className="pl-9" />
              </div>
              <Select value={flightFilter} onValueChange={setFlightFilter}>
                <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="All flights" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All flights</SelectItem>
                  {flights.map((flight) => <SelectItem key={flight.id} value={String(flight.id)}>{flight.flightNumber}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading && rows.length === 0 ? (
            <div className="space-y-3 p-4">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-16 w-full" />)}</div>
          ) : error ? (
            <div className="flex min-h-52 flex-col items-center justify-center gap-3 p-6 text-center">
              <p className="text-sm font-medium text-destructive">{error}</p>
              <Button variant="outline" onClick={() => dispatch(getOwnerFares())}><RefreshCw className="size-4" /> Retry</Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex min-h-52 flex-col items-center justify-center p-6 text-center">
              <CircleDollarSign className="mb-3 size-9 text-muted-foreground" />
              <p className="font-medium text-foreground">No matching fares</p>
              <p className="mt-1 text-sm text-muted-foreground">Create a fare or adjust the current filters.</p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[920px] text-sm">
                  <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Fare product</th>
                      <th className="px-4 py-3 font-medium">Flight / Cabin</th>
                      <th className="px-4 py-3 font-medium">Price</th>
                      <th className="px-4 py-3 font-medium">Configuration</th>
                      <th className="sticky right-0 bg-muted/95 px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((fare) => (
                      <tr key={fare.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{fare.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">RBD {fare.rbdCode} {fare.fareLabel ? `· ${fare.fareLabel}` : ""}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{flightLabel(fare)}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{fare.cabinClass?.replaceAll("_", " ") || `Cabin #${fare.cabinClassId}`}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-foreground">{money.format(fare.totalPrice || fare.currentPrice || 0)}</p>
                          <p className="mt-1 text-xs text-muted-foreground">Base {money.format(fare.baseFare || 0)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant={fare.fareRulesId || fare.fareRules ? "default" : "secondary"}>{fare.fareRulesId || fare.fareRules ? "Rule ready" : "Rule missing"}</Badge>
                            <Badge variant={fare.baggagePolicy ? "outline" : "secondary"}>{fare.baggagePolicy ? "Baggage ready" : "Baggage missing"}</Badge>
                          </div>
                        </td>
                        <td className="sticky right-0 bg-card px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <IconAction label="View fare" icon={Eye} onClick={() => navigate(`/airline/fares/${fare.id}`)} />
                            <IconAction label="Edit fare" icon={Pencil} onClick={() => navigate(`/airline/fares/${fare.id}/edit`)} />
                            <IconAction label="Delete fare" icon={Trash2} onClick={() => setFareToDelete(fare)} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-border lg:hidden">
                {filtered.map((fare) => (
                  <article key={fare.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{fare.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{flightLabel(fare)} · RBD {fare.rbdCode}</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <IconAction label="View fare" icon={Eye} onClick={() => navigate(`/airline/fares/${fare.id}`)} />
                        <IconAction label="Edit fare" icon={Pencil} onClick={() => navigate(`/airline/fares/${fare.id}/edit`)} />
                        <IconAction label="Delete fare" icon={Trash2} onClick={() => setFareToDelete(fare)} />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between rounded-md bg-muted/50 p-3">
                      <span className="text-xs text-muted-foreground">Total price</span>
                      <span className="font-semibold text-foreground">{money.format(fare.totalPrice || fare.currentPrice || 0)}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant={fare.fareRulesId || fare.fareRules ? "default" : "secondary"}>{fare.fareRulesId || fare.fareRules ? "Rule ready" : "Rule missing"}</Badge>
                      <Badge variant={fare.baggagePolicy ? "outline" : "secondary"}>{fare.baggagePolicy ? "Baggage ready" : "Baggage missing"}</Badge>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      <AlertDialog open={Boolean(fareToDelete)} onOpenChange={(open) => !open && setFareToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete fare product?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes {fareToDelete?.name}, including its linked fare rule and baggage policy. Existing bookings are not changed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep fare</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>Delete fare</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
};

export default FareManagement;
