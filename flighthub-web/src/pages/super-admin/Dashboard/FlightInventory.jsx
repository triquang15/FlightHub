import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, Clock, Plane, RefreshCw } from "lucide-react";

import api from "@/utils/api";
import { unwrapApiData } from "@/utils/flightOps";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const statusClass = {
  SCHEDULED: "bg-blue-100 text-blue-800",
  BOARDING: "bg-cyan-100 text-cyan-800",
  DEPARTED: "bg-violet-100 text-violet-800",
  ARRIVED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const FlightInventory = () => {
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadInventory = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/api/flight-instances/list");
      setInstances(unwrapApiData(response) || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load flight inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    api.get("/api/flight-instances/list")
      .then((response) => {
        if (active) setInstances(unwrapApiData(response) || []);
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.response?.data?.message || "Unable to load flight inventory");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => ({
    total: instances.length,
    live: instances.filter((item) => ["BOARDING", "DEPARTED"].includes(item.status)).length,
    issues: instances.filter((item) => item.status === "CANCELLED").length,
  }), [instances]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Flight Operations</h1>
          <p className="text-muted-foreground">Read-only system-wide operational inventory</p>
        </div>
        <Button variant="outline" onClick={loadInventory} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          ["Total instances", stats.total, Plane, "text-blue-600"],
          ["Live operations", stats.live, Activity, "text-emerald-600"],
          ["Cancelled", stats.issues, AlertTriangle, "text-red-600"],
        ].map(([label, value, Icon, color]) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 p-5">
              <Icon className={`h-8 w-8 ${color}`} />
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent flight instances</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {!loading && !error && instances.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">No flight instances available.</p>
          )}
          {instances.slice(0, 20).map((instance) => (
            <div
              key={instance.id}
              className="flex flex-col justify-between gap-3 rounded-lg border p-4 sm:flex-row sm:items-center"
            >
              <div>
                <p className="font-semibold">
                  {instance.flightNumber} · {instance.departureAirport?.iataCode} → {instance.arrivalAirport?.iataCode}
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {new Date(instance.departureDateTime).toLocaleString()} · {instance.availableSeats}/{instance.totalSeats} seats available
                </p>
              </div>
              <Badge className={statusClass[instance.status] || "bg-muted text-muted-foreground"}>
                {instance.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default FlightInventory;
