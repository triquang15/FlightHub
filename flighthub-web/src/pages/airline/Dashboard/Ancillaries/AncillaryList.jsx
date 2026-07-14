import { useEffect, useMemo, useState } from "react";
import { Edit, Package, Plus, RefreshCw, Search, ShieldCheck, Trash2 } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { deleteAncillary, getAllAncillaries } from "@/Redux/ancillary/ancillaryThunk";
import { getAncillaryIcon } from "@/utils/ancillaryIcons";

const toAncillaryArray = (payload) => (Array.isArray(payload) ? payload : payload?.content || []);
const typeLabel = (value) => String(value || "OTHER").replaceAll("_", " ");

const Stat = ({ label, value, detail }) => (
  <div className="border-r border-border px-4 py-3 last:border-r-0">
    <p className="text-xs font-medium text-muted-foreground">{label}</p>
    <div className="mt-2 flex items-baseline gap-2">
      <span className="text-2xl font-semibold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{detail}</span>
    </div>
  </div>
);

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

const MetadataPreview = ({ ancillary }) => {
  const baggage = ancillary.metadata?.baggage;
  if (baggage) {
    return (
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-md bg-muted/50 p-2">
          <span className="text-muted-foreground">Weight</span>
          <p className="mt-1 font-medium text-foreground">{baggage.weight || "N/A"} {baggage.unit || "KG"}</p>
        </div>
        <div className="rounded-md bg-muted/50 p-2">
          <span className="text-muted-foreground">Pieces</span>
          <p className="mt-1 font-medium text-foreground">{baggage.pieces || "N/A"}</p>
        </div>
        <div className="rounded-md bg-muted/50 p-2">
          <span className="text-muted-foreground">Category</span>
          <p className="mt-1 truncate font-medium text-foreground">{baggage.category || "N/A"}</p>
        </div>
      </div>
    );
  }

  if (ancillary.metadata?.protectionSummary) {
    return (
      <p className="mt-3 line-clamp-2 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
        {ancillary.metadata.protectionSummary}
      </p>
    );
  }

  return null;
};

const AncillaryList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { ancillaries, loading, error } = useSelector((state) => state.ancillary);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("ALL");
  const [ancillaryToDelete, setAncillaryToDelete] = useState(null);

  useEffect(() => {
    dispatch(getAllAncillaries());
  }, [dispatch]);

  const ancillaryList = useMemo(() => toAncillaryArray(ancillaries), [ancillaries]);
  const types = useMemo(
    () => Array.from(new Set(ancillaryList.map((item) => item.type).filter(Boolean))).sort(),
    [ancillaryList],
  );
  const coverageCount = ancillaryList.filter((item) => Array.isArray(item.coverages) && item.coverages.length > 0).length;
  const visualCount = ancillaryList.filter((item) => item.iconUrl).length;
  const baggageCount = ancillaryList.filter((item) => item.type === "BAGGAGE").length;
  const protectionCount = ancillaryList.filter((item) => item.type === "TRAVEL_PROTECTION").length;

  const filteredAncillaries = useMemo(() => {
    const query = search.trim().toLowerCase();
    return ancillaryList.filter((ancillary) => {
      const matchesSearch =
        !query ||
        ancillary.name?.toLowerCase().includes(query) ||
        ancillary.description?.toLowerCase().includes(query) ||
        ancillary.rfisc?.toLowerCase().includes(query);
      const matchesType = type === "ALL" || ancillary.type === type;
      return matchesSearch && matchesType;
    });
  }, [ancillaryList, search, type]);

  const confirmDelete = async () => {
    if (!ancillaryToDelete) return;
    try {
      await dispatch(deleteAncillary(ancillaryToDelete.id)).unwrap();
      toast.success("Ancillary deleted", {
        description: `${ancillaryToDelete.name} was removed from the master catalog.`,
      });
      setAncillaryToDelete(null);
    } catch (deleteError) {
      toast.error("Unable to delete ancillary", { description: String(deleteError) });
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-5 pb-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
              <Package className="size-4" />
              Service catalog
            </div>
            <h1 className="text-2xl font-semibold text-foreground">Master Ancillaries</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Manage reusable ancillary catalog items before assigning them to flight cabins.
            </p>
          </div>
          <Button onClick={() => navigate("/airline/ancillaries/create")}>
            <Plus className="size-4" />
            Create ancillary
          </Button>
        </header>

        <section className="grid overflow-hidden rounded-md border border-border bg-card sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Catalog items" value={ancillaryList.length} detail="total" />
          <Stat label="Baggage" value={baggageCount} detail="items" />
          <Stat label="Protection" value={protectionCount} detail="items" />
          <Stat label="With visual" value={visualCount} detail="items" />
        </section>

        <section className="overflow-hidden rounded-md border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Catalog register</h2>
              <p className="text-xs text-muted-foreground">
                Showing {filteredAncillaries.length} of {ancillaryList.length} master services.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, RFISC or description"
                  className="pl-9"
                />
              </div>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All types</SelectItem>
                  {types.map((item) => (
                    <SelectItem key={item} value={item}>{typeLabel(item)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => dispatch(getAllAncillaries())}>
                <RefreshCw className="size-4" />
                Refresh
              </Button>
            </div>
          </div>

          {loading && ancillaryList.length === 0 ? (
            <div className="grid gap-4 p-4 lg:grid-cols-2">
              {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-48 rounded-md" />)}
            </div>
          ) : error ? (
            <div className="flex min-h-52 flex-col items-center justify-center gap-3 p-6 text-center">
              <p className="text-sm font-medium text-destructive">{error}</p>
              <Button variant="outline" onClick={() => dispatch(getAllAncillaries())}>
                <RefreshCw className="size-4" /> Retry
              </Button>
            </div>
          ) : filteredAncillaries.length === 0 ? (
            <div className="flex min-h-52 flex-col items-center justify-center p-6 text-center">
              <Package className="mb-3 size-9 text-muted-foreground" />
              <p className="font-medium text-foreground">No matching ancillaries</p>
              <p className="mt-1 text-sm text-muted-foreground">Create a catalog item or adjust the current filters.</p>
            </div>
          ) : (
            <div className="grid gap-4 p-4 xl:grid-cols-2">
              {filteredAncillaries.map((ancillary) => {
                const Icon = getAncillaryIcon(ancillary.type, ancillary.subType);
                const coverages = Array.isArray(ancillary.coverages) ? ancillary.coverages : [];
                return (
                  <Card key={ancillary.id} className="rounded-md border-border bg-card">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-primary/10 text-primary">
                          {ancillary.iconUrl ? (
                            <img src={ancillary.iconUrl} alt={ancillary.name} className="h-full w-full object-cover" />
                          ) : (
                            <Icon className="size-5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="truncate text-base font-semibold text-foreground">{ancillary.name}</h3>
                              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                {ancillary.description || "No description provided."}
                              </p>
                            </div>
                            <div className="flex shrink-0 gap-1">
                              <IconAction label="Edit ancillary" icon={Edit} onClick={() => navigate(`/airline/ancillaries/edit/${ancillary.id}`)} />
                              <IconAction label="Delete ancillary" icon={Trash2} onClick={() => setAncillaryToDelete(ancillary)} />
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Badge variant="default">{typeLabel(ancillary.type)}</Badge>
                            {ancillary.subType && <Badge variant="secondary">{ancillary.subType}</Badge>}
                            {ancillary.rfisc && <Badge variant="outline">RFISC {ancillary.rfisc}</Badge>}
                            {coverages.length > 0 && (
                              <Badge variant="outline" className="gap-1">
                                <ShieldCheck className="size-3" />
                                {coverages.length} coverage{coverages.length === 1 ? "" : "s"}
                              </Badge>
                            )}
                          </div>
                          <MetadataPreview ancillary={ancillary} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        <AlertDialog open={Boolean(ancillaryToDelete)} onOpenChange={(open) => !open && setAncillaryToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete ancillary?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes {ancillaryToDelete?.name} from the master catalog. It cannot be deleted if active flight cabin offers still reference it.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep ancillary</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>Delete ancillary</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
};

export default AncillaryList;
