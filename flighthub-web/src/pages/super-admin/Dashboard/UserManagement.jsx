import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllUsers } from "@/Redux/user/userThunks";
import {
  AlertTriangle,
  Users,
  Search,
  Shield,
  User,
  Plane,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Mail,
  Phone,
  Clock,
  Trash2,
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
import api from "@/utils/api";
import { toast } from "sonner";

const SYSTEM_ADMIN_ROLE = "ROLE_SYSTEM_ADMIN";

function getRoleMeta(role) {
  switch (role) {
    case SYSTEM_ADMIN_ROLE:
      return { label: "System Admin", color: "bg-purple-100 text-purple-700" };
    case "ROLE_AIRLINE_OWNER":
      return { label: "Airline Owner", color: "bg-blue-100 text-blue-700" };
    case "ROLE_CUSTOMER":
      return { label: "Customer", color: "bg-teal-100 text-teal-700" };
    default:
      return { label: role, color: "bg-gray-100 text-gray-600" };
  }
}

function formatDate(dateStr) {
  if (!dateStr) return "Never";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
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

const MIN_RELOAD_SPINNER_MS = 500;

const wait = (ms) => new Promise((resolve) => {
  window.setTimeout(resolve, ms);
});

const isSystemAdmin = (user) => user?.role === SYSTEM_ADMIN_ROLE;

/* ─────────────────────── stat card ─────────────────────── */
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className={`rounded-xl p-4 flex items-center gap-4 ${color}`}>
      <div className="p-3 bg-white/40 rounded-lg">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm opacity-80">{label}</p>
      </div>
    </div>
  );
}

/* ─────────────────────── sort header ─────────────────────── */
function SortHeader({ label, field, sortField, sortDir, onSort }) {
  const active = sortField === field;
  return (
    <th
      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700"
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

/* ─────────────────────── main component ─────────────────────── */
const UserManagement = () => {
  const dispatch = useDispatch();
  const { users, usersLoading, usersError } = useSelector((s) => s.user);
  const safeUsers = useMemo(() => (Array.isArray(users) ? users : []), [users]);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortField, setSortField] = useState("fullName");
  const [sortDir, setSortDir] = useState("asc");
  const [refreshSpinning, setRefreshSpinning] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    dispatch(getAllUsers());
  }, [dispatch]);

  async function handleRefresh() {
    const startedAt = Date.now();
    setRefreshSpinning(true);

    try {
      await dispatch(getAllUsers());
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
      await dispatch(getAllUsers()).unwrap();
    } catch (err) {
      const message = err.response?.data?.message || "Unable to delete user.";
      toast.error(message, { id: "delete-user" });
    } finally {
      setDeletingId(null);
    }
  }

  function handleSort(field) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  /* stats derived from real data */
  const stats = useMemo(() => {
    const total = safeUsers.length;
    const customers = safeUsers.filter((u) => u.role === "ROLE_CUSTOMER").length;
    const airlineOwners = safeUsers.filter((u) => u.role === "ROLE_AIRLINE_OWNER").length;
    const superAdmins = safeUsers.filter((u) => u.role === SYSTEM_ADMIN_ROLE).length;
    return { total, customers, airlineOwners, superAdmins };
  }, [safeUsers]);

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

    list.sort((a, b) => {
      let av = a[sortField] ?? "";
      let bv = b[sortField] ?? "";
      if (sortField === "lastLogin") {
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
  }, [safeUsers, search, roleFilter, sortField, sortDir]);

  const uniqueRoles = useMemo(() => [...new Set(safeUsers.map((u) => u.role).filter(Boolean))], [safeUsers]);

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div />
        <button
          onClick={handleRefresh}
          disabled={usersLoading || refreshSpinning}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition"
        >
          <RefreshCw className={`h-4 w-4 ${usersLoading || refreshSpinning ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={stats.total} color="bg-indigo-100 text-indigo-700" />
        <StatCard icon={User} label="Customers" value={stats.customers} color="bg-green-100 text-green-700" />
        <StatCard icon={Plane} label="Airline Owners" value={stats.airlineOwners} color="bg-blue-100 text-blue-700" />
        <StatCard icon={Shield} label="System Admins" value={stats.superAdmins} color="bg-purple-100 text-purple-700" />
      </div>

      {/* filters */}
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col sm:flex-row gap-3 shadow-sm">

      {/* search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
        
        <input
          type="text"
          placeholder="Search by name, email or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
      <div className="relative min-w-[180px]">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
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

    </div>

      {/* table */}
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">

      {usersLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
          <RefreshCw className="h-8 w-8 animate-spin mb-3 text-indigo-400" />
          <p className="text-sm">Loading users…</p>
        </div>
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">

            {/* header */}
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  #
                </th>

                <SortHeader
                  label="Name"
                  field="fullName"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                />

                <SortHeader
                  label="Email"
                  field="email"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                />

                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Phone
                </th>

                <SortHeader
                  label="Last Login"
                  field="lastLogin"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                />

                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            {/* body */}
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map((user, idx) => {
                const roleMeta = getRoleMeta(user.role);
                const protectedUser = isSystemAdmin(user);

                return (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                  >
                    {/* index */}
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {idx + 1}
                    </td>

                    {/* name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">

                        {/* avatar */}
                        <div
                          className="
                            h-9 w-9 rounded-full
                            bg-gradient-to-br from-indigo-100 to-indigo-200
                            dark:from-indigo-800 dark:to-indigo-700
                            flex items-center justify-center
                            text-indigo-600 dark:text-indigo-200
                            font-semibold text-xs
                            shadow-sm
                          "
                        >
                          {(user.fullName || user.email || "?")[0].toUpperCase()}
                        </div>

                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {user.fullName || "—"}
                          </p>

                          {user.username && (
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              @{user.username}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* email */}
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                        <Mail className="h-3.5 w-3.5 text-gray-400" />
                        {user.email || "—"}
                      </span>
                    </td>

                    {/* role */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleMeta.color}`}
                      >
                        {roleMeta.label}
                      </span>
                    </td>

                    {/* phone */}
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                        {user.phone || "—"}
                      </span>
                    </td>

                    {/* last login */}
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        {formatDate(user.lastLogin)}
                      </span>
                    </td>

                    {/* actions */}
                    <td className="px-4 py-3 text-right">
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

          {/* footer */}
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-500 text-right">
            Showing {filtered.length} of {safeUsers.length} users
          </div>
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
