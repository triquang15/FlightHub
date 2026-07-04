import { useEffect, useMemo, useState } from "react";
import { format, isAfter, isBefore, isValid } from "date-fns";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit,
  Percent,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  Users,
} from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { clearCouponError } from "@/Redux/coupon/couponSlice";
import { deleteCoupon, getAllCoupons } from "@/Redux/coupon/couponThunk";
import { cn } from "@/lib/utils";

const itemsPerPage = 25;

const toCouponArray = (payload) => (Array.isArray(payload) ? payload : payload?.content || []);

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return isValid(date) ? date : null;
};

const formatDate = (value) => {
  const date = parseDate(value);
  return date ? format(date, "MMM dd, yyyy") : "Not set";
};

const formatMoney = (amount, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const getComputedStatus = (coupon) => {
  if (!coupon) return "INACTIVE";
  if (coupon.status && coupon.status !== "ACTIVE") return coupon.status;
  const now = new Date();
  const validFrom = parseDate(coupon.validFrom);
  const validUntil = parseDate(coupon.validUntil);
  if (validFrom && isBefore(now, validFrom)) return "SCHEDULED";
  if (validUntil && isAfter(now, validUntil)) return "EXPIRED";
  if (coupon.usageLimit && Number(coupon.usedCount || 0) >= Number(coupon.usageLimit)) return "DEPLETED";
  return coupon.status || "ACTIVE";
};

const discountLabel = (coupon) =>
  coupon.discountType === "PERCENTAGE"
    ? `${Number(coupon.discountValue || 0)}%`
    : formatMoney(coupon.discountValue);

const statusStyles = {
  ACTIVE: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  SCHEDULED: "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-300",
  INACTIVE: "border-slate-500/20 bg-slate-500/10 text-slate-600 dark:text-slate-300",
  EXPIRED: "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-300",
  DEPLETED: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300",
};

const Stat = ({ label, value, detail }) => (
  <div className="border-r border-border px-4 py-3 last:border-r-0">
    <p className="text-xs font-medium text-muted-foreground">{label}</p>
    <div className="mt-2 flex items-baseline gap-2">
      <span className="text-2xl font-semibold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{detail}</span>
    </div>
  </div>
);

const IconAction = ({ label, icon: Icon, onClick, className }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={label}
        onClick={onClick}
        className={className}
      >
        <Icon className="size-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
);

const CouponTable = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { coupons, paginatedCoupons, loading, error, deleteLoading } = useSelector((store) => store.coupon);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [couponToDelete, setCouponToDelete] = useState(null);

  useEffect(() => {
    dispatch(
      getAllCoupons({
        page: currentPage - 1,
        size: itemsPerPage,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        keyword: keyword.trim() || undefined,
      }),
    );
  }, [currentPage, dispatch, keyword, statusFilter]);

  useEffect(() => () => dispatch(clearCouponError()), [dispatch]);

  const couponList = useMemo(() => {
    const source = toCouponArray(paginatedCoupons?.content).length > 0 ? paginatedCoupons.content : coupons;
    return toCouponArray(source);
  }, [coupons, paginatedCoupons]);

  const filteredCoupons = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return couponList.filter((coupon) => {
      const status = getComputedStatus(coupon);
      const matchesSearch =
        !query ||
        coupon.code?.toLowerCase().includes(query) ||
        coupon.description?.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "ALL" || status === statusFilter;
      const matchesType = typeFilter === "ALL" || coupon.discountType === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [couponList, keyword, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    const total = couponList.length;
    const active = couponList.filter((coupon) => getComputedStatus(coupon) === "ACTIVE").length;
    const scheduled = couponList.filter((coupon) => getComputedStatus(coupon) === "SCHEDULED").length;
    const expiringSoon = couponList.filter((coupon) => {
      const validUntil = parseDate(coupon.validUntil);
      if (!validUntil) return false;
      const days = (validUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return days >= 0 && days <= 14;
    }).length;
    return { total, active, scheduled, expiringSoon };
  }, [couponList]);

  const totalElements = paginatedCoupons?.totalElements || filteredCoupons.length;
  const totalPages = paginatedCoupons?.totalPages || (filteredCoupons.length > 0 ? 1 : 0);

  const confirmDelete = async () => {
    if (!couponToDelete) return;
    try {
      await dispatch(deleteCoupon(couponToDelete.id)).unwrap();
      toast.success("Coupon deleted", {
        description: `${couponToDelete.code} was removed from the promotion catalog.`,
      });
      setCouponToDelete(null);
    } catch (deleteError) {
      toast.error("Unable to delete coupon", { description: String(deleteError) });
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-5 pb-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
              <Tag className="size-4" />
              Pricing promotions
            </div>
            <h1 className="text-2xl font-semibold text-foreground">Coupons</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Manage controlled promo codes for booking discounts, usage limits, and validity windows.
            </p>
          </div>
          <Button onClick={() => navigate("/airline/coupons/new")}>
            <Plus className="size-4" />
            Create coupon
          </Button>
        </header>

        <section className="grid overflow-hidden rounded-md border border-border bg-card sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Coupons" value={stats.total} detail="total" />
          <Stat label="Active" value={stats.active} detail="usable now" />
          <Stat label="Scheduled" value={stats.scheduled} detail="future start" />
          <Stat label="Expiring soon" value={stats.expiringSoon} detail="within 14 days" />
        </section>

        <section className="overflow-hidden rounded-md border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border p-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Coupon register</h2>
              <p className="text-xs text-muted-foreground">
                Showing {filteredCoupons.length} of {totalElements} coupons.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 sm:w-80">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={keyword}
                  onChange={(event) => {
                    setKeyword(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search code or description"
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                  <SelectItem value="DEPLETED">Depleted</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All discounts</SelectItem>
                  <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                  <SelectItem value="FIXED_AMOUNT">Fixed amount</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => dispatch(getAllCoupons({ page: currentPage - 1, size: itemsPerPage }))}>
                <RefreshCw className="size-4" />
                Refresh
              </Button>
            </div>
          </div>

          {loading && couponList.length === 0 ? (
            <div className="space-y-3 p-4">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-16 w-full" />)}</div>
          ) : error ? (
            <div className="flex min-h-56 flex-col items-center justify-center gap-3 p-6 text-center">
              <Tag className="size-10 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Coupons are not available</p>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  {error}. The UI is ready, but the coupon API must be enabled before airline users can manage promo codes.
                </p>
              </div>
              <Button variant="outline" onClick={() => dispatch(getAllCoupons({ page: 0, size: itemsPerPage }))}>
                <RefreshCw className="size-4" /> Retry
              </Button>
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center p-6 text-center">
              <Percent className="mb-3 size-9 text-muted-foreground" />
              <p className="font-medium text-foreground">No coupons found</p>
              <p className="mt-1 text-sm text-muted-foreground">Create a promo code or adjust the current filters.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table className="min-w-[1180px]">
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[220px]">Coupon</TableHead>
                      <TableHead className="w-[150px]">Discount</TableHead>
                      <TableHead className="w-[260px]">Validity</TableHead>
                      <TableHead className="w-[170px]">Usage</TableHead>
                      <TableHead className="w-[170px]">Scope</TableHead>
                      <TableHead className="w-[130px]">Status</TableHead>
                      <TableHead className="sticky right-0 w-[96px] bg-muted/50 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCoupons.map((coupon) => {
                      const status = getComputedStatus(coupon);
                      const cabins = coupon.applicableCabinClasses?.length
                        ? coupon.applicableCabinClasses.join(", ")
                        : "All cabins";
                      return (
                        <TableRow key={coupon.id} className="hover:bg-muted/40">
                          <TableCell>
                            <div className="flex items-start gap-3">
                              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                <Tag className="size-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-mono text-sm font-semibold text-foreground">{coupon.code}</p>
                                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                  {coupon.description || "No description"}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold text-foreground">{discountLabel(coupon)}</div>
                            <p className="text-xs text-muted-foreground">
                              {coupon.discountType === "PERCENTAGE" ? "Percentage" : "Fixed amount"}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-foreground">
                              <Calendar className="size-4 text-muted-foreground" />
                              <span>{formatDate(coupon.validFrom)}</span>
                              <span className="text-muted-foreground">to</span>
                              <span>{formatDate(coupon.validUntil)}</span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Min spend {formatMoney(coupon.minPurchaseAmount)}
                              {coupon.maxDiscountAmount ? ` · cap ${formatMoney(coupon.maxDiscountAmount)}` : ""}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Users className="size-4 text-muted-foreground" />
                              <span className="text-sm font-medium text-foreground">
                                {coupon.usedCount || 0} / {coupon.usageLimit || "Unlimited"}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">Per user: {coupon.perUserLimit || 1}</p>
                          </TableCell>
                          <TableCell>
                            <p className="truncate text-sm font-medium text-foreground">{cabins}</p>
                            <p className="text-xs text-muted-foreground">
                              {coupon.applicableRoutes?.length ? `${coupon.applicableRoutes.length} route(s)` : "All routes"}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("border", statusStyles[status] || statusStyles.INACTIVE)}>
                              {status.replaceAll("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="sticky right-0 bg-card text-right shadow-[-8px_0_16px_-16px_rgba(0,0,0,0.6)]">
                            <div className="flex justify-end gap-1">
                              <IconAction
                                label="Edit coupon"
                                icon={Edit}
                                onClick={() => navigate(`/airline/coupons/${coupon.id}/edit`)}
                              />
                              <IconAction
                                label="Delete coupon"
                                icon={Trash2}
                                onClick={() => setCouponToDelete(coupon)}
                                className="text-destructive hover:text-destructive"
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="size-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        <AlertDialog open={Boolean(couponToDelete)} onOpenChange={(open) => !open && setCouponToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete coupon?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove <span className="font-semibold">{couponToDelete?.code}</span> from the promotion
                catalog. Customers will no longer be able to apply it at checkout.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete coupon
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
};

export default CouponTable;
