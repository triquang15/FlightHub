import { Briefcase, Luggage, PackageCheck, ShieldCheck } from "lucide-react";

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

const BaggagePolicyState = ({ policies = [] }) => {
  const policyList = Array.isArray(policies) ? policies : [];
  const cabinIncluded = policyList.filter((policy) => Number(policy.cabinBaggagePieces) > 0).length;
  const checkedIncluded = policyList.filter((policy) => Number(policy.checkInBaggagePieces) > 0).length;
  const priorityIncluded = policyList.filter((policy) => policy.priorityBaggage).length;

  return (
    <section className="grid overflow-hidden rounded-md border border-border bg-card sm:grid-cols-2 lg:grid-cols-4">
      <Stat icon={PackageCheck} label="Configured fares" value={policyList.length} detail="policies" />
      <Stat icon={Briefcase} label="Cabin baggage" value={cabinIncluded} detail="fares" />
      <Stat icon={Luggage} label="Checked baggage" value={checkedIncluded} detail="fares" />
      <Stat icon={ShieldCheck} label="Priority baggage" value={priorityIncluded} detail="fares" />
    </section>
  );
};

export default BaggagePolicyState;
