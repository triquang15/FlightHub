import { useEffect, useMemo, useState } from "react";
import { Briefcase, Eye, Luggage, Pencil, RefreshCw, Search, ShieldCheck, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { deletePolicy, getPolicyByAirline } from "@/Redux/baggagePolicy/baggagePolicyThunk";
import BaggagePolicyState from "./BaggagePolicyState";

const toPolicies = (value) => (Array.isArray(value) ? value : value?.content || []);
const formatKg = (value) => (Number(value) > 0 ? `${Number(value).toLocaleString("en-US")} kg` : "Not included");
const formatPieces = (value) => `${Number(value || 0)} pc${Number(value || 0) === 1 ? "" : "s"}`;

const IconAction = ({ label, icon: Icon, onClick }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button type="button" variant="ghost" size="icon" aria-label={label} onClick={onClick}>
        <Icon className="size-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
);

const BaggagePolicyTable = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { policies, loading, error } = useSelector((state) => state.baggagePolicy);
  const currentAirline = useSelector((state) => state.airline?.currentAirline);
  const [search, setSearch] = useState("");
  const [benefit, setBenefit] = useState("all");
  const [policyToDelete, setPolicyToDelete] = useState(null);

  useEffect(() => {
    if (currentAirline?.id) dispatch(getPolicyByAirline(currentAirline.id));
  }, [currentAirline?.id, dispatch]);

  const policyList = useMemo(() => toPolicies(policies), [policies]);
  const filteredPolicies = useMemo(() => {
    const query = search.trim().toLowerCase();
    return policyList.filter((policy) => {
      const matchesSearch =
        !query ||
        policy.name?.toLowerCase().includes(query) ||
        policy.description?.toLowerCase().includes(query) ||
        String(policy.fareId).includes(query);
      const matchesBenefit =
        benefit === "all" ||
        (benefit === "priority" && policy.priorityBaggage) ||
        (benefit === "extra" && policy.extraBaggageAllowance) ||
        (benefit === "standard" && !policy.priorityBaggage && !policy.extraBaggageAllowance);
      return matchesSearch && matchesBenefit;
    });
  }, [benefit, policyList, search]);

  const confirmDelete = async () => {
    if (!policyToDelete) return;
    try {
      await dispatch(deletePolicy(policyToDelete.id)).unwrap();
      toast.success("Baggage policy deleted", {
        description: `${policyToDelete.name} was removed from fare #${policyToDelete.fareId}.`,
      });
      setPolicyToDelete(null);
    } catch (deleteError) {
      toast.error("Unable to delete baggage policy", { description: String(deleteError) });
    }
  };

  if (loading && policyList.length === 0) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-24 rounded-md" />)}
        </div>
        <Skeleton className="h-80 rounded-md" />
      </div>
    );
  }

  if (!currentAirline?.id) {
    return (
      <section className="flex min-h-64 flex-col items-center justify-center rounded-md border border-border bg-card p-6 text-center">
        <Luggage className="mb-3 size-10 text-muted-foreground" />
        <p className="font-medium text-foreground">Airline profile required</p>
        <p className="mt-1 text-sm text-muted-foreground">Complete or reload your airline profile before managing baggage policies.</p>
      </section>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-5">
        <BaggagePolicyState policies={policyList} />

        <section className="overflow-hidden rounded-md border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Policy register</h2>
              <p className="text-xs text-muted-foreground">
                Showing {filteredPolicies.length} of {policyList.length} baggage policies. One policy is attached to one fare.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search policy or fare ID"
                  className="pl-9"
                />
              </div>
              <Select value={benefit} onValueChange={setBenefit}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All benefits</SelectItem>
                  <SelectItem value="priority">Priority baggage</SelectItem>
                  <SelectItem value="extra">Extra allowance</SelectItem>
                  <SelectItem value="standard">Standard only</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => dispatch(getPolicyByAirline(currentAirline.id))}>
                <RefreshCw className="size-4" />
                Refresh
              </Button>
            </div>
          </div>

          {error ? (
            <div className="flex min-h-52 flex-col items-center justify-center gap-3 p-6 text-center">
              <p className="text-sm font-medium text-destructive">{error}</p>
              <Button variant="outline" onClick={() => dispatch(getPolicyByAirline(currentAirline.id))}>
                <RefreshCw className="size-4" /> Retry
              </Button>
            </div>
          ) : filteredPolicies.length === 0 ? (
            <div className="flex min-h-52 flex-col items-center justify-center p-6 text-center">
              <Luggage className="mb-3 size-9 text-muted-foreground" />
              <p className="font-medium text-foreground">No matching baggage policies</p>
              <p className="mt-1 text-sm text-muted-foreground">Create a policy or adjust the current filters.</p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1040px] table-fixed text-sm">
                  <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="w-[28%] px-4 py-3 font-medium">Policy</th>
                      <th className="w-[18%] px-4 py-3 font-medium">Cabin baggage</th>
                      <th className="w-[18%] px-4 py-3 font-medium">Checked baggage</th>
                      <th className="w-[18%] px-4 py-3 font-medium">Benefits</th>
                      <th className="sticky right-0 w-[18%] border-l border-border bg-muted/95 px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredPolicies.map((policy) => (
                      <tr key={policy.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <p className="truncate font-medium text-foreground">{policy.name}</p>
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            Fare #{policy.fareId} {policy.description ? `· ${policy.description}` : ""}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 font-medium text-foreground">
                            <Briefcase className="size-4 text-primary" />
                            {formatPieces(policy.cabinBaggagePieces)}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatKg(policy.cabinBaggageMaxWeight)}
                            {policy.cabinBaggageMaxDimension ? ` · ${policy.cabinBaggageMaxDimension} cm` : ""}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 font-medium text-foreground">
                            <Luggage className="size-4 text-primary" />
                            {formatPieces(policy.checkInBaggagePieces)}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatKg(policy.checkInBaggageMaxWeight)}
                            {Number(policy.freeCheckedBagsAllowance) > 0 ? ` · ${policy.freeCheckedBagsAllowance} free` : ""}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant={policy.priorityBaggage ? "default" : "secondary"}>
                              {policy.priorityBaggage ? "Priority" : "No priority"}
                            </Badge>
                            <Badge variant={policy.extraBaggageAllowance ? "outline" : "secondary"}>
                              {policy.extraBaggageAllowance ? "Extra allowed" : "Standard"}
                            </Badge>
                          </div>
                        </td>
                        <td className="sticky right-0 border-l border-border bg-card px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <IconAction label="View policy" icon={Eye} onClick={() => navigate(`/airline/baggage-policies/${policy.id}`)} />
                            <IconAction label="Edit policy" icon={Pencil} onClick={() => navigate(`/airline/baggage-policies/${policy.id}/edit`)} />
                            <IconAction label="Delete policy" icon={Trash2} onClick={() => setPolicyToDelete(policy)} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-border lg:hidden">
                {filteredPolicies.map((policy) => (
                  <article key={policy.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{policy.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Fare #{policy.fareId}</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <IconAction label="View policy" icon={Eye} onClick={() => navigate(`/airline/baggage-policies/${policy.id}`)} />
                        <IconAction label="Edit policy" icon={Pencil} onClick={() => navigate(`/airline/baggage-policies/${policy.id}/edit`)} />
                        <IconAction label="Delete policy" icon={Trash2} onClick={() => setPolicyToDelete(policy)} />
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-md bg-muted/50 p-2">
                        <span className="flex items-center gap-1 text-muted-foreground"><Briefcase className="size-3" /> Cabin</span>
                        <p className="mt-1 font-medium text-foreground">{formatPieces(policy.cabinBaggagePieces)} · {formatKg(policy.cabinBaggageMaxWeight)}</p>
                      </div>
                      <div className="rounded-md bg-muted/50 p-2">
                        <span className="flex items-center gap-1 text-muted-foreground"><Luggage className="size-3" /> Checked</span>
                        <p className="mt-1 font-medium text-foreground">{formatPieces(policy.checkInBaggagePieces)} · {formatKg(policy.checkInBaggageMaxWeight)}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>

        <AlertDialog open={Boolean(policyToDelete)} onOpenChange={(open) => !open && setPolicyToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete baggage policy?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes {policyToDelete?.name} from fare #{policyToDelete?.fareId}. Future purchases will no longer show this baggage allowance.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep policy</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>Delete policy</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
};

export default BaggagePolicyTable;
