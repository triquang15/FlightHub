import { ArrowRightLeft, CircleDollarSign, FileCheck2, Plus, ShieldCheck } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import FareRulesTable from "./FareRulesTable";

const Stat = ({ icon: Icon, label, value, detail }) => (
  <div className="border-r border-border px-4 py-3 last:border-r-0">
    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
      <Icon className="size-4" />
      {label}
    </div>
    <div className="mt-2 flex items-baseline gap-2">
      <span className="text-2xl font-semibold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{detail}</span>
    </div>
  </div>
);

const FareRulesManagement = () => {
  const navigate = useNavigate();
  const { fareRules } = useSelector((state) => state.fareRules);
  const rules = Array.isArray(fareRules) ? fareRules : [];

  const refundable = rules.filter((rule) => rule.isRefundable).length;
  const changeable = rules.filter((rule) => rule.isChangeable).length;
  const feeProtected = rules.filter(
    (rule) => Number(rule.changeFee) > 0 || Number(rule.cancellationFee) > 0,
  ).length;

  return (
    <div className="space-y-5 pb-8">
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
            <CircleDollarSign className="size-4" />
            Commercial controls
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Fare Rules</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Control refund and change conditions for each published fare.
          </p>
        </div>
        <Button onClick={() => navigate("/airline/fare-rules/new")}>
          <Plus className="size-4" />
          Create rule
        </Button>
      </header>

      <section className="grid overflow-hidden rounded-md border border-border bg-card sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={FileCheck2} label="Configured fares" value={rules.length} detail="rules" />
        <Stat icon={ShieldCheck} label="Refundable" value={refundable} detail="fares" />
        <Stat icon={ArrowRightLeft} label="Changeable" value={changeable} detail="fares" />
        <Stat icon={CircleDollarSign} label="Fee protected" value={feeProtected} detail="fares" />
      </section>

      <FareRulesTable />
    </div>
  );
};

export default FareRulesManagement;
