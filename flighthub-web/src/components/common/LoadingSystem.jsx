import { Loader2, Plane } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const spinnerSizes = {
  sm: "h-4 w-4",
  default: "h-6 w-6",
  lg: "h-9 w-9",
};

export const ButtonSpinner = ({ size = "sm", className = "" }) => (
  <Loader2 className={cn(spinnerSizes[size], "animate-spin", className)} />
);

export const SpinnerLoader = ({ size = "default", className = "" }) => (
  <span
    className={cn(
      "inline-flex shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/20 border-t-primary",
      spinnerSizes[size],
      "animate-spin",
      className
    )}
    aria-label="Loading"
  />
);

export const PageLoader = ({
  message = "Loading...",
  detail = "Preparing the latest data for this workspace.",
  className = "",
}) => (
  <div className={cn("flex min-h-[360px] items-center justify-center p-6", className)}>
    <div className="relative w-full max-w-md overflow-hidden rounded-lg border border-border bg-card p-6 text-center shadow-sm">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
        <Plane className="h-6 w-6" />
      </div>
      <div className="mt-5 flex items-center justify-center gap-2 text-sm font-semibold text-foreground">
        <SpinnerLoader size="sm" />
        {message}
      </div>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted-foreground">{detail}</p>
      <div className="mt-6 space-y-2">
        <Skeleton className="mx-auto h-2 w-4/5" />
        <Skeleton className="mx-auto h-2 w-2/3" />
      </div>
    </div>
  </div>
);

export const RouteProgress = ({ active }) => (
  <div
    className={cn(
      "pointer-events-none fixed inset-x-0 top-0 z-[100] h-1 overflow-hidden bg-transparent transition-opacity duration-200",
      active ? "opacity-100" : "opacity-0"
    )}
    aria-hidden="true"
  >
    <div className="h-full w-1/3 animate-[loading-bar_1s_ease-in-out_infinite] rounded-r-full bg-primary shadow-lg shadow-primary/20" />
  </div>
);

export const StatCardSkeleton = ({ className = "" }) => (
  <div className={cn("rounded-lg border border-border bg-card p-4", className)}>
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1 space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-10 w-10 rounded-md" />
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 6, columns = 6, className = "" }) => (
  <div className={cn("overflow-hidden rounded-lg border border-border bg-card", className)}>
    <div className="border-b border-border p-4">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="mt-2 h-3 w-60" />
    </div>
    <div className="overflow-x-auto">
      <div className="min-w-[760px]">
        <div
          className="grid gap-4 border-b border-border bg-muted/40 p-4"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} className="h-3 w-20" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid gap-4 border-b border-border/70 p-4 last:border-b-0"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((_, columnIndex) => (
              <Skeleton
                key={columnIndex}
                className={cn("h-4", columnIndex === 0 ? "w-28" : "w-20")}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const PageSkeleton = ({ className = "" }) => (
  <div className={cn("space-y-6", className)}>
    <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-3">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-[min(32rem,80vw)]" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <StatCardSkeleton key={index} />
      ))}
    </div>
    <TableSkeleton />
  </div>
);

export const BookingCardSkeleton = ({ className = "" }) => (
  <div className={cn("rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900", className)}>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-28 rounded-xl" />
    </div>
    <div className="mt-6 grid gap-4 md:grid-cols-3">
      <Skeleton className="h-24 rounded-2xl" />
      <Skeleton className="h-24 rounded-2xl" />
      <Skeleton className="h-24 rounded-2xl" />
    </div>
  </div>
);
