import { BriefcaseBusiness, Luggage, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import BaggagePolicyTable from "./BaggagePolicyTable";

const BaggagePolicyPage = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-5 pb-8">
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
            <Luggage className="size-4" />
            Commercial controls
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Baggage Policies</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Define carry-on, checked baggage, and priority handling for each sellable fare.
          </p>
        </div>
        <Button onClick={() => navigate("/airline/baggage-policies/new")}>
          <Plus className="size-4" />
          Create policy
        </Button>
      </header>

      <section className="flex items-start gap-3 rounded-md border border-border bg-muted/30 p-4 text-sm">
        <BriefcaseBusiness className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="text-muted-foreground">
          Baggage policies are fare-level rules. Keep one policy per fare so traveler checkout, ticket emails, and support views show the same allowance.
        </p>
      </section>

      <BaggagePolicyTable />
    </div>
  );
};

export default BaggagePolicyPage;
