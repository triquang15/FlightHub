import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllUsers } from "@/Redux/user/userThunks";
import {
  AlertTriangle,
  Users,
  Search,
  Shield,
  Plane,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronUp,
  ChevronDown,
  Mail,
  Phone,
  Clock,
  Trash2,
  Plus,
  X,
  Lock,
  CheckCircle2,
  UserCheck,
  CalendarDays,
  SlidersHorizontal,
  KeyRound,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/utils/api";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/common/LoadingSystem";

const SYSTEM_ADMIN_ROLE = "ROLE_SYSTEM_ADMIN";
const ROLE_OPTIONS = [
  SYSTEM_ADMIN_ROLE,
  "ROLE_AIRLINE_OWNER",
  "ROLE_CUSTOMER",
];

function getRoleMeta(role) {
  switch (role) {
    case SYSTEM_ADMIN_ROLE:
      return { label: "System Admin", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300" };
    case "ROLE_AIRLINE_OWNER":
      return { label: "Airline Owner", color: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" };
    case "ROLE_CUSTOMER":
      return { label: "Customer", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" };
    default:
      return { label: role || "Unknown", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300" };
  }
}

function getInitials(user) {
  const value = user?.fullName || user?.email || "?";
  return value
    .split(/[ .@_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";
}

function getUserAvatarSrc(user) {
  return user?.avatarUrl || user?.profilePicture || "";
}

function getAccountState(user) {
  if (user?.active === false) {
    return {
      label: "Inactive",
      color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
    };
  }
  if (user?.verified === false) {
    return {
      label: "Unverified",
      color: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    };
  }
  return {
    label: "Active",
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  };
}

function getLoginProviderMeta(provider) {
  switch (provider) {
    case "GOOGLE":
      return {
        label: "Google",
        color: "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300",
      };
    case "FACEBOOK":
      return {
        label: "Facebook",
        color: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
      };
    case "APPLE":
      return {
        label: "Apple",
        color: "bg-gray-950 text-white dark:bg-white dark:text-gray-950",
      };
    case "PASSWORD":
      return {
        label: "Password",
        color: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
      };
    default:
      return {
        label: provider || "Unknown",
        color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
      };
  }
}

function getLoginProviders(user) {
  return Array.isArray(user?.loginProviders) && user.loginProviders.length > 0
    ? user.loginProviders
    : ["PASSWORD"];
}

function formatDate(dateStr, fallback = "Never") {
  if (!dateStr) return fallback;
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function formatCompactDate(dateStr, fallback = "Never") {
  if (!dateStr) {
    return { date: fallback, time: "", full: fallback };
  }

  try {
    const value = new Date(dateStr);
    return {
      date: value.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      time: value.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      full: formatDate(dateStr),
    };
  } catch {
    return { date: "—", time: "", full: "—" };
  }
}

function getProviderLoginLabel(provider, dateStr) {
  const providerLabel = getLoginProviderMeta(provider).label;
  return `Last via ${providerLabel} · ${formatDate(dateStr)}`;
}

function getCompactProviderLoginLabel(provider, dateStr) {
  const providerLabel = getLoginProviderMeta(provider).label;
  const compact = formatCompactDate(dateStr);
  return `${providerLabel} · ${compact.date}${compact.time ? `, ${compact.time}` : ""}`;
}

function titleOrUndefined(value) {
  if (value === null || value === undefined || value === "—") {
    return undefined;
  }
  return String(value);
}

const MIN_RELOAD_SPINNER_MS = 500;

const wait = (ms) => new Promise((resolve) => {
  window.setTimeout(resolve, ms);
});

const isSystemAdmin = (user) => user?.role === SYSTEM_ADMIN_ROLE;

const DEFAULT_CREATE_FORM = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  role: "ROLE_AIRLINE_OWNER",
};

/* ─────────────────────── stat card ─────────────────────── */
function StatCard({ icon: Icon, label, value, detail, color }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-950 dark:text-gray-50">{value}</p>
          {detail && <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">{detail}</p>}
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      </div>
    </div>
  );
}

/* ─────────────────────── sort header ─────────────────────── */
function SortHeader({ label, field, sortField, sortDir, onSort, className = "" }) {
  const active = sortField === field;
  return (
    <th
      className={`cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 ${className}`}
      onClick={() => onSort(field)}
    >
      <span className="flex items-center gap-1">
        {label}
        <span className="flex flex-col">
          <ChevronUp
            className={`h-3 w-3 -mb-1 ${active && sortDir === "asc" ? "text-indigo-600" : "text-gray-300"}`}
          />
          <ChevronDown
            className={`h-3 w-3 ${active && sortDir === "desc" ? "text-indigo-600" : "text-gray-300"}`}
          />
        </span>
      </span>
    </th>
  );
}

function UserPagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  onItemsPerPageChange,
}) {
  const page = Number(currentPage) || 1;
  const size = Number(itemsPerPage) || 10;
  const total = Number(totalItems) || 0;
  const pages = Math.max(Number(totalPages) || 1, 1);

  const startItem = total === 0 ? 0 : (page - 1) * size + 1;
  const endItem = Math.min(page * size, total);

  const getPageNumbers = () => {
    const result = [];
    const max = 5;
    let start = Math.max(1, page - Math.floor(max / 2));
    let end = Math.min(pages, start + max - 1);

    if (end - start + 1 < max) {
      start = Math.max(1, end - max + 1);
    }

    for (let i = start; i <= end; i += 1) {
      result.push(i);
    }

    return result;
  };

  if (total === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 border-t border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
        <span>
          Showing {startItem} to {endItem} of {total} users
        </span>

        <div className="flex items-center gap-2">
          <span>Rows:</span>
          <Select
            value={String(size)}
            onValueChange={(value) => {
              onItemsPerPageChange(Number(value));
              onPageChange(1);
            }}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={page === 1}
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-1">
          {getPageNumbers().map((p) => (
            <Button
              key={p}
              variant={page === p ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(p)}
              className="w-9"
            >
              {p}
            </Button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pages)}
          disabled={page >= pages}
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

/* ─────────────────────── main component ─────────────────────── */
const UserManagement = () => {
  const dispatch = useDispatch();
  const { users, usersLoading, usersError, total, totalPages } = useSelector((s) => s.user);
  const safeUsers = useMemo(() => (Array.isArray(users) ? users : []), [users]);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [sortField, setSortField] = useState("fullName");
  const [sortDir, setSortDir] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [refreshSpinning, setRefreshSpinning] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(DEFAULT_CREATE_FORM);
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const loadUsers = useCallback(() => {
    return dispatch(
      getAllUsers({
        page: currentPage - 1,
        size: itemsPerPage,
        sort: `${sortField},${sortDir}`,
        keyword: search.trim() || undefined,
        role: roleFilter === "all" ? undefined : roleFilter,
      })
    );
  }, [currentPage, dispatch, itemsPerPage, roleFilter, search, sortDir, sortField]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function handleRefresh() {
    const startedAt = Date.now();
    setRefreshSpinning(true);

    try {
      await loadUsers();
    } finally {
      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_RELOAD_SPINNER_MS) {
        await wait(MIN_RELOAD_SPINNER_MS - elapsed);
      }
      setRefreshSpinning(false);
    }
  }

  async function handleDeleteUser() {
    if (!deleteTarget) return;

    if (isSystemAdmin(deleteTarget)) {
      toast.error("System admin accounts cannot be deleted");
      setDeleteTarget(null);
      return;
    }

    setDeletingId(deleteTarget.id);
    toast.loading("Deleting user account...", { id: "delete-user" });

    try {
      await api.delete(`/api/users/${deleteTarget.id}`);
      setDeleteTarget(null);
      toast.success("User deleted successfully", { id: "delete-user" });
      await loadUsers().unwrap();
    } catch (err) {
      const message = err.response?.data?.message || "Unable to delete user.";
      toast.error(message, { id: "delete-user" });
    } finally {
      setDeletingId(null);
    }
  }

  const updateCreateField = (field, value) => {
    setCreateForm((current) => ({ ...current, [field]: value }));
  };

  async function handleCreateUser(event) {
    event.preventDefault();

    const payload = {
      fullName: createForm.fullName.trim(),
      email: createForm.email.trim().toLowerCase(),
      phone: createForm.phone.trim() || undefined,
      password: createForm.password,
      role: createForm.role,
    };

    if (!payload.fullName || !payload.email || !payload.password || !payload.role) {
      toast.error("Full name, email, password, and role are required");
      return;
    }

    if (payload.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setCreateSubmitting(true);
    toast.loading("Creating user account...", { id: "create-user" });

    try {
      await api.post("/api/users", payload);
      toast.success("User account created", { id: "create-user" });
      setCreateForm(DEFAULT_CREATE_FORM);
      setCreateOpen(false);
      await loadUsers().unwrap();
    } catch (err) {
      const message = err.response?.data?.message || "Unable to create user account";
      toast.error(message, { id: "create-user" });
    } finally {
      setCreateSubmitting(false);
    }
  }

  function handleSort(field) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setCurrentPage(1);
  }

  /* filtered + sorted list */
  const filtered = useMemo(() => {
    let list = [...safeUsers];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.fullName?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.phone?.toLowerCase().includes(q)
      );
    }

    if (roleFilter !== "all") {
      list = list.filter((u) => u.role === roleFilter);
    }

    if (providerFilter !== "all") {
      list = list.filter((u) => getLoginProviders(u).includes(providerFilter));
    }

    list.sort((a, b) => {
      let av = a[sortField] ?? "";
      let bv = b[sortField] ?? "";
      if (sortField === "lastLogin" || sortField === "createdAt") {
        av = av ? new Date(av).getTime() : 0;
        bv = bv ? new Date(bv).getTime() : 0;
      } else {
        av = String(av).toLowerCase();
        bv = String(bv).toLowerCase();
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [safeUsers, search, roleFilter, providerFilter, sortField, sortDir]);

  /* stats derived from real data */
  const stats = useMemo(() => {
    const visibleUsers = filtered.length;
    const activeUsers = filtered.filter((u) => u.active !== false).length;
    const airlineOwners = safeUsers.filter((u) => u.role === "ROLE_AIRLINE_OWNER").length;
    const superAdmins = safeUsers.filter((u) => u.role === SYSTEM_ADMIN_ROLE).length;
    const socialLinked = safeUsers.filter((u) => getLoginProviders(u).some((provider) => provider === "GOOGLE" || provider === "FACEBOOK")).length;
    return { visible: visibleUsers, active: activeUsers, airlineOwners, superAdmins, socialLinked };
  }, [filtered, safeUsers]);

  const uniqueRoles = useMemo(() => ROLE_OPTIONS, []);
  const hasFilters = search.trim() || roleFilter !== "all" || providerFilter !== "all";

  return (
    <div className="min-w-0 max-w-full space-y-6">
      {/* header */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
              <Shield className="h-3.5 w-3.5" />
              System administration
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-950 dark:text-gray-50">User Management</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              Create controlled platform accounts, review access level, and remove accounts that no longer need access.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-gray-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-200"
          >
            <Plus className="h-4 w-4" />
            Create user
          </button>
          <button
            onClick={handleRefresh}
            disabled={usersLoading || refreshSpinning}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition"
          >
            <RefreshCw className={`h-4 w-4 ${usersLoading || refreshSpinning ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
        </div>
      </div>

      {createOpen && (
        <form
          onSubmit={handleCreateUser}
          className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950"
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-gray-950 dark:text-gray-50">Create platform account</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Use this for airline owner onboarding or controlled admin-created accounts.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCreateOpen(false);
                setCreateForm(DEFAULT_CREATE_FORM);
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100"
              aria-label="Close create user form"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Full name</span>
              <input
                value={createForm.fullName}
                onChange={(event) => updateCreateField("fullName", event.target.value)}
                className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-950 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50"
                placeholder="Nguyen Van A"
                required
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Email</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(event) => updateCreateField("email", event.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-950 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50"
                  placeholder="owner@flighthub.local"
                  required
                />
              </div>
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Phone</span>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={createForm.phone}
                  onChange={(event) => updateCreateField("phone", event.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-950 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50"
                  placeholder="+84912345678"
                />
              </div>
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Role</span>
              <select
                value={createForm.role}
                onChange={(event) => updateCreateField("role", event.target.value)}
                className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-950 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>{getRoleMeta(role).label}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Temporary password</span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(event) => updateCreateField("password", event.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-950 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50"
                  placeholder="Min 8 characters"
                  minLength={8}
                  required
                />
              </div>
            </label>
          </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-800 dark:bg-gray-900/60">
              <p className="font-semibold text-gray-950 dark:text-gray-50">Creation rules</p>
              <div className="mt-3 space-y-2 text-gray-600 dark:text-gray-400">
                <div className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span>Public signup cannot create privileged roles.</span>
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span>Phone must match Vietnamese local or +84 format when provided.</span>
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span>System admin accounts are protected from deletion.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCreateOpen(false);
                setCreateForm(DEFAULT_CREATE_FORM);
              }}
              disabled={createSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createSubmitting}>
              {createSubmitting ? "Creating..." : "Create account"}
            </Button>
          </div>
        </form>
      )}

      {/* stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={Users} label="Results shown" value={stats.visible} detail={`${total || 0} total matching records`} color="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300" />
        <StatCard icon={UserCheck} label="Active visible" value={stats.active} detail="Accounts not disabled" color="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" />
        <StatCard icon={Plane} label="Airline owners" value={stats.airlineOwners} detail="Current page count" color="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" />
        <StatCard icon={Shield} label="Protected admins" value={stats.superAdmins} detail="Deletion disabled" color="bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300" />
        <StatCard icon={KeyRound} label="Social linked" value={stats.socialLinked} detail="Google or Facebook connected" color="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" />
      </div>

      {/* filters */}
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-950 dark:text-gray-50">
          <SlidersHorizontal className="h-4 w-4 text-gray-500" />
          Filters
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setRoleFilter("all");
              setProviderFilter("all");
              setCurrentPage(1);
            }}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Reset filters
          </button>
        )}
      </div>
      <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(280px,1fr)_180px_190px]">

      {/* search */}
      <div className="relative min-w-0 flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
        
        <input
          type="text"
          placeholder="Search by name, email or phone…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="
            w-full pl-9 pr-4 py-2 text-sm rounded-lg
            bg-gray-50 dark:bg-gray-800
            border border-gray-200 dark:border-gray-600
            text-gray-900 dark:text-gray-100
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-indigo-500
            focus:border-transparent
            transition
          "
        />
      </div>

      {/* role filter */}
      <div className="relative min-w-0">
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="
            w-full px-3 py-2 text-sm rounded-lg
            bg-gray-50 dark:bg-gray-800
            border border-gray-200 dark:border-gray-600
            text-gray-900 dark:text-gray-100
            focus:outline-none focus:ring-2 focus:ring-indigo-500
            focus:border-transparent
            transition
            appearance-none
          "
        >
          <option value="all">All Roles</option>
          {uniqueRoles.map((r) => (
            <option key={r} value={r}>
              {getRoleMeta(r).label}
            </option>
          ))}
        </select>

        {/* custom dropdown icon */}
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
      </div>

      {/* login provider filter */}
      <div className="relative min-w-0">
        <select
          value={providerFilter}
          onChange={(e) => {
            setProviderFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="
            w-full px-3 py-2 text-sm rounded-lg
            bg-gray-50 dark:bg-gray-800
            border border-gray-200 dark:border-gray-600
            text-gray-900 dark:text-gray-100
            focus:outline-none focus:ring-2 focus:ring-indigo-500
            focus:border-transparent
            transition
            appearance-none
          "
        >
          <option value="all">All Login Methods</option>
          <option value="PASSWORD">Password</option>
          <option value="GOOGLE">Google</option>
          <option value="FACEBOOK">Facebook</option>
        </select>

        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
      </div>

      </div>
    </div>

      {/* table */}
    <div className="min-w-0 max-w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <div className="flex flex-col gap-1 border-b border-gray-200 px-4 py-3 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-950 dark:text-gray-50">Accounts</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Sorted by {sortField} ({sortDir})</p>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {hasFilters ? "Filtered result set" : "All accounts"}
        </p>
      </div>

      {usersLoading ? (
        <TableSkeleton rows={7} columns={9} className="border-0 shadow-none" />
      ) : usersError ? (
        <div className="flex flex-col items-center justify-center py-20 text-red-400">
          <p className="font-medium">Failed to load users</p>
          <p className="text-sm mt-1 opacity-80">{usersError}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
          <Users className="h-10 w-10 mb-3 opacity-40" />
          <p className="font-medium">No users found</p>
          <p className="text-sm mt-1">Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="w-full max-w-full overflow-x-auto overscroll-x-contain rounded-b-lg [scrollbar-color:theme(colors.gray.300)_transparent] [scrollbar-width:thin] dark:[scrollbar-color:theme(colors.gray.700)_transparent]">
          <table className="w-[1720px] min-w-[1720px] table-fixed text-sm">

            {/* header */}
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="w-14 px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  #
                </th>

                <SortHeader
                  label="Name"
                  field="fullName"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="w-80"
                />

                <SortHeader
                  label="Email"
                  field="email"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="w-80"
                />

                <th className="w-40 px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>

                <th className="w-32 px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>

                <th className="w-48 px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Login
                </th>

                <th className="w-40 px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Phone
                </th>

                <SortHeader
                  label="Last Login"
                  field="lastLogin"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="w-36"
                />

                <SortHeader
                  label="Created"
                  field="createdAt"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="w-36"
                />

                <th className="w-24 bg-gray-50 px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            {/* body */}
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map((user, idx) => {
                const roleMeta = getRoleMeta(user.role);
                const accountState = getAccountState(user);
                const protectedUser = isSystemAdmin(user);
                const rowNumber = (currentPage - 1) * itemsPerPage + idx + 1;
                const loginProviders = getLoginProviders(user);
                const lastProvider = user.lastLoginProvider || loginProviders[0];
                const providerLoginAt = user.lastProviderLoginAt || user.lastLogin;
                const providerLoginLabel = getProviderLoginLabel(lastProvider, providerLoginAt);
                const compactProviderLoginLabel = getCompactProviderLoginLabel(lastProvider, providerLoginAt);
                const lastLogin = formatCompactDate(user.lastLogin);
                const created = formatCompactDate(user.createdAt, "—");
                const avatarSrc = getUserAvatarSrc(user);

                return (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                  >
                    {/* index */}
                    <td className="w-14 px-4 py-3 text-gray-400 text-xs">
                      {rowNumber}
                    </td>

                    {/* name */}
                    <td className="w-80 px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">

                        {/* avatar */}
                        {avatarSrc ? (
                          <img
                            src={avatarSrc}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-full border border-gray-200 bg-gray-100 object-cover shadow-sm dark:border-gray-700 dark:bg-gray-800"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className="
                              flex h-10 w-10 shrink-0 items-center justify-center rounded-full
                              bg-gradient-to-br from-indigo-100 to-indigo-200
                              text-xs font-semibold text-indigo-600 shadow-sm
                              dark:from-indigo-800 dark:to-indigo-700 dark:text-indigo-200
                            "
                          >
                            {getInitials(user)}
                          </div>
                        )}

                        <div className="min-w-0">
                          <p
                            className="truncate font-medium text-gray-900 dark:text-gray-100"
                            title={titleOrUndefined(user.fullName)}
                          >
                            {user.fullName || "—"}
                          </p>

                          {user.username && (
                            <p className="truncate text-xs text-gray-400 dark:text-gray-500" title={user.username}>
                              @{user.username}
                            </p>
                          )}
                          {user.hasCustomAvatar && (
                            <p className="truncate text-[11px] text-indigo-500 dark:text-indigo-300">
                              Custom profile photo
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* email */}
                    <td className="w-80 px-4 py-3">
                      <span className="flex min-w-0 items-center gap-1 text-gray-600 dark:text-gray-300">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                        <span className="truncate" title={titleOrUndefined(user.email)}>
                          {user.email || "—"}
                        </span>
                      </span>
                    </td>

                    {/* role */}
                    <td className="w-40 px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleMeta.color}`}
                      >
                        {roleMeta.label}
                      </span>
                    </td>

                    {/* status */}
                    <td className="w-32 px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${accountState.color}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {accountState.label}
                      </span>
                    </td>

                    {/* login providers */}
                    <td className="w-48 px-4 py-3">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap gap-1.5">
                          {loginProviders.map((provider) => {
                            const meta = getLoginProviderMeta(provider);
                            return (
                              <span
                                key={provider}
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.color}`}
                              >
                                {meta.label}
                              </span>
                            );
                          })}
                        </div>
                        <p
                          className="flex min-w-0 items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400"
                          title={providerLoginLabel}
                        >
                          <KeyRound className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {compactProviderLoginLabel}
                          </span>
                        </p>
                      </div>
                    </td>

                    {/* phone */}
                    <td className="w-40 px-4 py-3">
                      <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                        <span className="truncate" title={titleOrUndefined(user.phone)}>
                          {user.phone || "—"}
                        </span>
                      </span>
                    </td>

                    {/* last login */}
                    <td className="w-36 px-4 py-3">
                      <span
                        className="flex min-w-0 items-start gap-1 text-gray-500 dark:text-gray-400 text-xs"
                        title={titleOrUndefined(lastLogin.full)}
                      >
                        <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                        <span className="min-w-0">
                          <span className="block truncate">{lastLogin.date}</span>
                          {lastLogin.time && (
                            <span className="block truncate text-[11px] text-gray-400 dark:text-gray-500">
                              {lastLogin.time}
                            </span>
                          )}
                        </span>
                      </span>
                    </td>

                    {/* created */}
                    <td className="w-36 px-4 py-3">
                      <span
                        className="flex min-w-0 items-start gap-1 text-xs text-gray-500 dark:text-gray-400"
                        title={titleOrUndefined(created.full)}
                      >
                        <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                        <span className="min-w-0">
                          <span className="block truncate">{created.date}</span>
                          {created.time && (
                            <span className="block truncate text-[11px] text-gray-400 dark:text-gray-500">
                              {created.time}
                            </span>
                          )}
                        </span>
                      </span>
                    </td>

                    {/* actions */}
                    <td className="w-24 bg-white px-4 py-3 text-right dark:bg-gray-950">
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(user)}
                        disabled={protectedUser || deletingId === user.id}
                        title={protectedUser ? "System Admin accounts are protected" : "Delete user"}
                        aria-label={protectedUser ? "System Admin accounts are protected" : `Delete user ${user.email || user.id}`}
                        className="
                          inline-flex h-8 w-8 items-center justify-center rounded-lg
                          text-red-500 transition
                          hover:bg-red-50 hover:text-red-600
                          disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent
                          dark:hover:bg-red-950/30 dark:hover:text-red-300
                          dark:disabled:text-gray-700
                        "
                      >
                        <Trash2 className={`h-4 w-4 ${deletingId === user.id ? "animate-pulse" : ""}`} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <UserPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={total}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(value) => {
              setItemsPerPage(value);
              setCurrentPage(1);
            }}
          />
        </div>
      )}
    </div>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !deletingId) {
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-300 sm:mx-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <AlertDialogTitle className="text-red-600 dark:text-red-300">
              Delete user account?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {deleteTarget?.fullName || deleteTarget?.email || "this user"}
              </span>
              , revoke their sessions, and remove remembered devices. System Admin accounts are protected and cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteTarget && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900/60">
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 dark:text-gray-400">Email</span>
                <span className="truncate font-medium text-gray-900 dark:text-gray-100">{deleteTarget.email || "—"}</span>
              </div>
              <div className="mt-2 flex justify-between gap-4">
                <span className="text-gray-500 dark:text-gray-400">Role</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleMeta(deleteTarget.role).color}`}>
                  {getRoleMeta(deleteTarget.role).label}
                </span>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingId)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleDeleteUser();
              }}
              disabled={Boolean(deletingId) || isSystemAdmin(deleteTarget)}
              className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 dark:bg-red-600 dark:hover:bg-red-500"
            >
              {deletingId ? "Deleting..." : "Delete user"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserManagement;
