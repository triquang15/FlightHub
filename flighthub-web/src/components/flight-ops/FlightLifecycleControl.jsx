import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NEXT_FLIGHT_STATUSES } from "@/utils/flightOps";

const label = (status) =>
  status.charAt(0) + status.slice(1).toLowerCase();

const FlightLifecycleControl = ({ status, onTransition, compact = false }) => {
  const options = NEXT_FLIGHT_STATUSES[status] || [];
  const [target, setTarget] = useState(options[0] || "");
  const [loading, setLoading] = useState(false);

  if (options.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">
        Terminal state
      </span>
    );
  }

  const handleTransition = async () => {
    if (!target) return;
    setLoading(true);
    try {
      await onTransition(target);
      toast.success(`Flight moved to ${label(target)}`);
    } catch (error) {
      toast.error(error || "Unable to change flight status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={compact ? "flex items-center gap-2" : "space-y-2"}>
      <Select value={target} onValueChange={setTarget} disabled={loading}>
        <SelectTrigger className={compact ? "h-8 w-[132px]" : "w-full"}>
          <SelectValue placeholder="Next status" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {label(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        size={compact ? "sm" : "default"}
        variant={target === "CANCELLED" ? "destructive" : "default"}
        onClick={handleTransition}
        disabled={loading || !target}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        {!compact && <span className="ml-2">Apply transition</span>}
      </Button>
    </div>
  );
};

export default FlightLifecycleControl;
