import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllUsers } from "@/Redux/user/userThunks";
import {
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
} from "lucide-react";

function getRoleMeta(role) {
  switch (role) {
    case "ROLE_SYSTEM_ADMIN":
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
  const { users, usersLoading, error } = useSelector((s) => s.user);
  const safeUsers = Array.isArray(users) ? users : [];

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortField, setSortField] = useState("fullName");
  const [sortDir, setSortDir] = useState("asc");

  useEffect(() => {
    dispatch(getAllUsers());
  }, [dispatch]);

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
    const total = users.length;
    const customers = users.filter((u) => u.role === "ROLE_CUSTOMER").length;
    const airlineOwners = users.filter((u) => u.role === "ROLE_AIRLINE_OWNER").length;
    const superAdmins = users.filter((u) => u.role === "ROLE_SYSTEM_ADMIN").length;
    return { total, customers, airlineOwners, superAdmins };
  }, [users]);

  /* filtered + sorted list */
  const filtered = useMemo(() => {
    let list = [...users];

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
  }, [users, search, roleFilter, sortField, sortDir]);

  const uniqueRoles = useMemo(() => [...new Set(users.map((u) => u.role).filter(Boolean))], [users]);

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div />
        <button
          onClick={() => dispatch(getAllUsers())}
          disabled={usersLoading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition"
        >
          <RefreshCw className={`h-4 w-4 ${usersLoading ? "animate-spin" : ""}`} />
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
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-red-400">
          <p className="font-medium">Failed to load users</p>
          <p className="text-sm mt-1 opacity-80">{error}</p>
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
              </tr>
            </thead>

            {/* body */}
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map((user, idx) => {
                const roleMeta = getRoleMeta(user.role);

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
    </div>
  );
};

export default UserManagement;
