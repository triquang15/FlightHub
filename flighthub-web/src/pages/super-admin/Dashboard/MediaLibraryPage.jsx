import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Clipboard,
  Database,
  Download,
  FileImage,
  Image,
  Maximize2,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import api from "@/utils/api";

const ENTITY_FILTERS = ["ALL", "USER_PROFILE", "AIRLINE", "MEAL", "ANCILLARY", "AIRPORT", "ROUTE", "LANDING"];
const PURPOSE_FILTERS = ["ALL", "AVATAR", "LOGO", "IMAGE", "ICON", "HERO"];
const PROVIDER_FILTERS = ["ALL", "LOCAL", "S3"];

const formatBytes = (bytes) => {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (value) => {
  if (!value) return "N/A";
  try {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "N/A";
  }
};

const normalizePage = (payload) => payload?.data ?? payload ?? {};

const entityLabel = (item) => {
  if (!item?.entityType) return "Unlinked";
  const type = String(item.entityType).replaceAll("_", " ");
  return item.entityId ? `${type} #${item.entityId}` : type;
};

const MediaLibraryPage = () => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [filters, setFilters] = useState({
    keyword: "",
    entityType: "ALL",
    purpose: "ALL",
    provider: "ALL",
  });

  const params = useMemo(
    () => ({
      page,
      size: 18,
      sortBy: "createdAt",
      sortDirection: "desc",
      keyword: filters.keyword || undefined,
      entityType: filters.entityType === "ALL" ? undefined : filters.entityType,
      purpose: filters.purpose === "ALL" ? undefined : filters.purpose,
      provider: filters.provider === "ALL" ? undefined : filters.provider,
    }),
    [filters.entityType, filters.keyword, filters.provider, filters.purpose, page]
  );

  const loadMedia = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/media", { params });
      const data = normalizePage(response.data);
      setItems(Array.isArray(data.content) ? data.content : []);
      setTotalPages(Number(data.totalPages) || 0);
      setTotalElements(Number(data.totalElements) || 0);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load media files");
      setItems([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const updateFilter = (key, value) => {
    setPage(0);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const copyValue = async (value, label) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}`);
    }
  };

  const deleteMedia = async (media) => {
    if (!media?.id) return;

    setDeletingId(media.id);
    try {
      await api.delete(`/api/media/${media.id}`, { params: { force: true } });
      toast.success("Media file deleted");
      setPendingDelete(null);
      await loadMedia();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not delete media file");
    } finally {
      setDeletingId(null);
    }
  };

  const imageCount = items.filter((item) => String(item.contentType || "").startsWith("image/")).length;
  const totalSize = items.reduce((sum, item) => sum + (Number(item.sizeBytes) || 0), 0);
  const s3Count = items.filter((item) => item.storageProvider === "S3").length;

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1 rounded-md">
              <Database className="h-3.5 w-3.5" />
              Media Service
            </Badge>
            <Badge variant="secondary" className="rounded-md">
              Local now, S3-ready later
            </Badge>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Media Library</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Review uploaded avatars, logos, meal images, ancillary icons, and airport hero images from one operational workspace.
          </p>
        </div>
        <Button variant="outline" onClick={loadMedia} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Files loaded" value={totalElements} detail="Matching current filters" icon={FileImage} />
        <SummaryCard label="Image previews" value={imageCount} detail="Visible on this page" icon={Image} />
        <SummaryCard label="Storage mix" value={`${s3Count} S3`} detail={`${formatBytes(totalSize)} on this page`} icon={Database} />
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-3 xl:grid-cols-[1fr_180px_180px_150px_auto]">
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filters.keyword}
                onChange={(event) => updateFilter("keyword", event.target.value)}
                placeholder="Search filename, storage key, or content type..."
                className="pl-9"
              />
            </div>
            <select
              value={filters.entityType}
              onChange={(event) => updateFilter("entityType", event.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              {ENTITY_FILTERS.map((option) => (
                <option key={option} value={option}>
                  {option === "ALL" ? "All entities" : option.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            <select
              value={filters.purpose}
              onChange={(event) => updateFilter("purpose", event.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              {PURPOSE_FILTERS.map((option) => (
                <option key={option} value={option}>
                  {option === "ALL" ? "All purposes" : option}
                </option>
              ))}
            </select>
            <select
              value={filters.provider}
              onChange={(event) => updateFilter("provider", event.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              {PROVIDER_FILTERS.map((option) => (
                <option key={option} value={option}>
                  {option === "ALL" ? "All storage" : option}
                </option>
              ))}
            </select>
            <Button
              variant="ghost"
              onClick={() => {
                setPage(0);
                setFilters({ keyword: "", entityType: "ALL", purpose: "ALL", provider: "ALL" });
              }}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-64 animate-pulse rounded-md border border-border bg-card" />
          ))}
        </div>
      ) : items.length ? (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {items.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              deleting={deletingId === item.id}
              onDelete={() => setPendingDelete(item)}
              onPreview={() => setPreviewMedia(item)}
              onCopyUrl={() => copyValue(item.publicUrl, "Public URL")}
              onCopyKey={() => copyValue(item.storageKey, "Storage key")}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
              <FileImage className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No media files found</h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Upload an avatar, airline logo, meal image, ancillary icon, or airport hero image to populate this library.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Page {totalPages ? page + 1 : 0} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" disabled={page <= 0 || loading} onClick={() => setPage((value) => Math.max(value - 1, 0))}>
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={page >= totalPages - 1 || loading}
            onClick={() => setPage((value) => value + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <MediaPreviewDialog
        media={previewMedia}
        onOpenChange={(open) => {
          if (!open) setPreviewMedia(null);
        }}
        onCopyUrl={() => copyValue(previewMedia?.publicUrl, "Public URL")}
        onCopyKey={() => copyValue(previewMedia?.storageKey, "Storage key")}
      />

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </AlertDialogMedia>
            <AlertDialogTitle>Force delete media asset?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the stored file and media metadata. It does not automatically clear references on airline,
              airport, meal, ancillary, or profile records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {pendingDelete ? (
            <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">{pendingDelete.originalFileName}</p>
              <p className="mt-1">{entityLabel(pendingDelete)} · {pendingDelete.purpose}</p>
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingId)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={Boolean(deletingId)}
              onClick={() => deleteMedia(pendingDelete)}
            >
              {deletingId ? "Deleting..." : "Force delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const SummaryCard = ({ label, value, detail, icon: Icon }) => (
  <Card>
    <CardContent className="flex items-start gap-4 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </div>
    </CardContent>
  </Card>
);

const MediaCard = ({ item, deleting, onDelete, onPreview, onCopyUrl, onCopyKey }) => {
  const isImage = String(item.contentType || "").startsWith("image/");

  return (
    <Card className="overflow-hidden">
      <div className="flex h-40 items-center justify-center border-b border-border bg-muted/40">
        {isImage ? (
          <img src={item.publicUrl} alt={item.originalFileName} className="h-full w-full object-cover" />
        ) : (
          <FileImage className="h-10 w-10 text-muted-foreground" />
        )}
      </div>
      <CardContent className="space-y-4 p-4">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground" title={item.originalFileName}>
                {item.originalFileName}
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground" title={item.storageKey}>
                {item.storageKey}
              </p>
            </div>
            <Badge variant="outline" className="shrink-0 rounded-md">
              {item.storageProvider || "LOCAL"}
            </Badge>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="secondary" className="rounded-md">
              {item.entityType}
            </Badge>
            <Badge variant="secondary" className="rounded-md">
              {item.purpose}
            </Badge>
            <Badge variant="outline" className="rounded-md">
              {formatBytes(item.sizeBytes)}
            </Badge>
          </div>
        </div>

        <div className="grid gap-2 text-xs text-muted-foreground">
          <div className="flex justify-between gap-3">
            <span>Linked to</span>
            <span className="truncate font-medium text-foreground" title={entityLabel(item)}>
              {entityLabel(item)}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span>Owner</span>
            <span className="font-medium text-foreground">{item.ownerUserId || "System"}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span>Created</span>
            <span className="font-medium text-foreground">{formatDate(item.createdAt)}</span>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2">
          <Button variant="outline" className="flex-1" asChild>
            <a href={item.publicUrl} target="_blank" rel="noreferrer">
              <Download className="mr-2 h-4 w-4" />
              Open
            </a>
          </Button>
          <Button variant="outline" size="icon" onClick={onPreview} aria-label="Preview media file">
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={onCopyKey} aria-label="Copy storage key">
            <Clipboard className="h-4 w-4" />
          </Button>
          <Button variant="destructive" size="icon" disabled={deleting} onClick={onDelete} aria-label="Delete media file">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const MediaPreviewDialog = ({ media, onOpenChange, onCopyUrl, onCopyKey }) => {
  const isImage = String(media?.contentType || "").startsWith("image/");

  return (
    <Dialog open={Boolean(media)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Media preview</DialogTitle>
          <DialogDescription>
            {media ? `${entityLabel(media)} · ${media.purpose} · ${media.storageProvider || "LOCAL"}` : ""}
          </DialogDescription>
        </DialogHeader>
        {media ? (
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="flex min-h-72 items-center justify-center overflow-hidden rounded-md border border-border bg-muted/40">
              {isImage ? (
                <img src={media.publicUrl} alt={media.originalFileName} className="max-h-[520px] w-full object-contain" />
              ) : (
                <FileImage className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-3 rounded-md border border-border bg-card p-4">
              <InfoRow label="File" value={media.originalFileName} />
              <InfoRow label="Storage key" value={media.storageKey} />
              <InfoRow label="Content type" value={media.contentType} />
              <InfoRow label="Size" value={formatBytes(media.sizeBytes)} />
              <InfoRow label="Owner" value={media.ownerUserId || "System"} />
              <InfoRow label="Created" value={formatDate(media.createdAt)} />
              <div className="grid gap-2 pt-2 sm:grid-cols-2">
                <Button variant="outline" onClick={onCopyUrl}>
                  <Clipboard className="mr-2 h-4 w-4" />
                  Copy URL
                </Button>
                <Button variant="outline" onClick={onCopyKey}>
                  <Clipboard className="mr-2 h-4 w-4" />
                  Copy key
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="min-w-0">
    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
    <p className="mt-1 break-words text-sm font-medium text-foreground">{value || "N/A"}</p>
  </div>
);

export default MediaLibraryPage;
