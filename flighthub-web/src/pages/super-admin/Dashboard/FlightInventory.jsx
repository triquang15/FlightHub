import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Plane,
  RefreshCw,
} from "lucide-react";

import api from "@/utils/api";
import { unwrapApiData } from "@/utils/flightOps";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusClass = {
  SCHEDULED: "bg-blue-100 text-blue-800",
  BOARDING: "bg-cyan-100 text-cyan-800",
  DEPARTED: "bg-violet-100 text-violet-800",
  ARRIVED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const FlightInventory = () => {
  const [instances, setInstances] = useState([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [pageInfo, setPageInfo] = useState({ totalElements: 0, totalPages: 0 });
  const [stats, setStats] = useState({ total: 0, live: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadInventory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [inventoryResponse, summaryResponse] = await Promise.all([
        api.get("/api/flight-instances/list", {
          params: { page, size: pageSize, sort: "departureDateTime,asc" },
        }),
        api.get("/api/flight-instances/inventory-summary"),
      ]);
      const inventoryPage = unwrapApiData(inventoryResponse) || {};
      const summary = unwrapApiData(summaryResponse) || {};

      setInstances(inventoryPage.content || []);
      setPageInfo({
        totalElements: inventoryPage.totalElements || 0,
        totalPages: inventoryPage.totalPages || 0,
      });
      setStats({
        total: summary.totalInstances || 0,
        live: summary.liveOperations || 0,
        cancelled: summary.cancelledInstances || 0,
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load flight inventory");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    const timerId = window.setTimeout(loadInventory, 0);
    return () => window.clearTimeout(timerId);
  }, [loadInventory]);

  const startItem = pageInfo.totalElements === 0 ? 0 : page * pageSize + 1;
  const endItem = Math.min((page + 1) * pageSize, pageInfo.totalElements);
  const totalPages = Math.max(pageInfo.totalPages, 1);

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
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
          ["Cancelled", stats.cancelled, AlertTriangle, "text-red-600"],
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
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Flight instances</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Showing {startItem}-{endItem} of {pageInfo.totalElements}
            </p>
          </div>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              setPageSize(Number(value));
              setPage(0);
            }}
          >
            <SelectTrigger className="w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((size) => (
                <SelectItem key={size} value={String(size)}>{size} rows</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {!loading && !error && instances.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">No flight instances available.</p>
          )}
          {instances.map((instance) => (
            <div
              key={instance.id}
              className="flex flex-col justify-between gap-3 rounded-lg border p-4 sm:flex-row sm:items-center"
            >
              <div>
                <p className="font-semibold">
                  {instance.flightNumber || `Flight #${instance.flightId}`} ·{" "}
                  {instance.departureAirport?.iataCode || "Airport unavailable"} →{" "}
                  {instance.arrivalAirport?.iataCode || "Airport unavailable"}
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {new Date(instance.departureDateTime).toLocaleString()} · {instance.availableSeats}/{instance.totalSeats} seats available
                </p>
                {(!instance.airlineName || !instance.aircraftCode) && (
                  <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                    Airline or aircraft reference is temporarily unavailable.
                  </p>
                )}
              </div>
              <Badge className={statusClass[instance.status] || "bg-muted text-muted-foreground"}>
                {instance.status}
              </Badge>
            </div>
          ))}
          {pageInfo.totalElements > 0 && (
            <div className="flex flex-col items-center justify-between gap-3 border-t pt-4 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setPage(0)} disabled={loading || page === 0}>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setPage((current) => current - 1)} disabled={loading || page === 0}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setPage((current) => current + 1)} disabled={loading || page >= totalPages - 1}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setPage(totalPages - 1)} disabled={loading || page >= totalPages - 1}>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FlightInventory;
