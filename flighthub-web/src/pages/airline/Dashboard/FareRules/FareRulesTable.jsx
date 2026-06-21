import { useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, Eye, Pencil, RefreshCw, Search, ShieldCheck, Trash2 } from "lucide-react";
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
import { deleteFareRule, getFareRulesByAirline } from "@/Redux/fareRules/fareRulesThunk";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const formatFee = (value) => (Number(value) > 0 ? currency.format(value) : "Free");

const IconAction = ({ label, icon: Icon, variant = "ghost", onClick }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button type="button" variant={variant} size="icon" aria-label={label} onClick={onClick}>
        <Icon className="size-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
);

const FareRulesTable = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { fareRules, loading, error } = useSelector((state) => state.fareRules);
  const [search, setSearch] = useState("");
  const [policy, setPolicy] = useState("all");
  const [ruleToDelete, setRuleToDelete] = useState(null);

  useEffect(() => {
    dispatch(getFareRulesByAirline());
  }, [dispatch]);

  const rules = useMemo(() => (Array.isArray(fareRules) ? fareRules : []), [fareRules]);
  const filteredRules = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rules.filter((rule) => {
      const matchesSearch =
        !query ||
        rule.ruleName?.toLowerCase().includes(query) ||
        String(rule.fareId).includes(query);
      const matchesPolicy =
        policy === "all" ||
        (policy === "refundable" && rule.isRefundable) ||
        (policy === "changeable" && rule.isChangeable) ||
        (policy === "restricted" && !rule.isRefundable && !rule.isChangeable);
      return matchesSearch && matchesPolicy;
    });
  }, [policy, rules, search]);

  const confirmDelete = async () => {
    if (!ruleToDelete) return;
    try {
      await dispatch(deleteFareRule(ruleToDelete.id)).unwrap();
      toast.success("Fare rule deleted", {
        description: `${ruleToDelete.ruleName} is no longer attached to fare #${ruleToDelete.fareId}.`,
      });
      setRuleToDelete(null);
    } catch (deleteError) {
      toast.error("Unable to delete fare rule", { description: String(deleteError) });
    }
  };

  return (
    <TooltipProvider>
      <section className="overflow-hidden rounded-md border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Policy register</h2>
            <p className="text-xs text-muted-foreground">One policy per fare. Changes affect future purchases.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search rule or fare ID"
                className="pl-9"
              />
            </div>
            <Select value={policy} onValueChange={setPolicy}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All policies</SelectItem>
                <SelectItem value="refundable">Refundable</SelectItem>
                <SelectItem value="changeable">Changeable</SelectItem>
                <SelectItem value="restricted">Restricted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading && rules.length === 0 ? (
          <div className="space-y-3 p-4">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-16 w-full" />)}</div>
        ) : error ? (
          <div className="flex min-h-52 flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm font-medium text-destructive">{error}</p>
            <Button variant="outline" onClick={() => dispatch(getFareRulesByAirline())}>
              <RefreshCw className="size-4" /> Retry
            </Button>
          </div>
        ) : filteredRules.length === 0 ? (
          <div className="flex min-h-52 flex-col items-center justify-center p-6 text-center">
            <ShieldCheck className="mb-3 size-9 text-muted-foreground" />
            <p className="font-medium text-foreground">No matching fare rules</p>
            <p className="mt-1 text-sm text-muted-foreground">Create a rule or adjust the current filters.</p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[860px] text-sm">
                <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Rule</th>
                    <th className="px-4 py-3 font-medium">Refund</th>
                    <th className="px-4 py-3 font-medium">Change</th>
                    <th className="px-4 py-3 font-medium">Deadlines</th>
                    <th className="sticky right-0 bg-muted/95 px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{rule.ruleName}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Fare #{rule.fareId}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={rule.isRefundable ? "default" : "secondary"}>
                          {rule.isRefundable ? "Refundable" : "Not refundable"}
                        </Badge>
                        {rule.isRefundable && <p className="mt-1 text-xs text-muted-foreground">Fee {formatFee(rule.cancellationFee)}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={rule.isChangeable ? "outline" : "secondary"}>
                          {rule.isChangeable ? "Changeable" : "Not changeable"}
                        </Badge>
                        {rule.isChangeable && <p className="mt-1 text-xs text-muted-foreground">Fee {formatFee(rule.changeFee)}</p>}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        <p>Refund: {rule.isRefundable ? `${rule.refundDeadlineDays ?? 0} days` : "N/A"}</p>
                        <p className="mt-1">Change: {rule.isChangeable ? `${rule.changeDeadlineHours ?? 0} hours` : "N/A"}</p>
                      </td>
                      <td className="sticky right-0 bg-card px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <IconAction label="View rule" icon={Eye} onClick={() => navigate(`/airline/fare-rules/${rule.id}`)} />
                          <IconAction label="Edit rule" icon={Pencil} onClick={() => navigate(`/airline/fare-rules/${rule.id}/edit`)} />
                          <IconAction label="Delete rule" icon={Trash2} variant="ghost" onClick={() => setRuleToDelete(rule)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-border lg:hidden">
              {filteredRules.map((rule) => (
                <article key={rule.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{rule.ruleName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Fare #{rule.fareId}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <IconAction label="View rule" icon={Eye} onClick={() => navigate(`/airline/fare-rules/${rule.id}`)} />
                      <IconAction label="Edit rule" icon={Pencil} onClick={() => navigate(`/airline/fare-rules/${rule.id}/edit`)} />
                      <IconAction label="Delete rule" icon={Trash2} onClick={() => setRuleToDelete(rule)} />
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-md bg-muted/50 p-2">
                      <span className="flex items-center gap-1 text-muted-foreground"><ShieldCheck className="size-3" /> Refund</span>
                      <p className="mt-1 font-medium text-foreground">{rule.isRefundable ? formatFee(rule.cancellationFee) : "Not allowed"}</p>
                    </div>
                    <div className="rounded-md bg-muted/50 p-2">
                      <span className="flex items-center gap-1 text-muted-foreground"><ArrowRightLeft className="size-3" /> Change</span>
                      <p className="mt-1 font-medium text-foreground">{rule.isChangeable ? formatFee(rule.changeFee) : "Not allowed"}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <AlertDialog open={Boolean(ruleToDelete)} onOpenChange={(open) => !open && setRuleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete fare rule?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes {ruleToDelete?.ruleName} from fare #{ruleToDelete?.fareId}. Future purchases will no longer show this policy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep rule</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>Delete rule</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
};

export default FareRulesTable;
