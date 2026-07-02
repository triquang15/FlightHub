export const ROLE_HOME = {
  ROLE_SYSTEM_ADMIN: "/super-admin/dashboard",
  ROLE_AIRLINE_OWNER: "/airline/dashboard",
  ROLE_CUSTOMER: "/traveler",
};

export const getRoleHome = (role) => ROLE_HOME[role] || "/traveler";

export const isPathAllowedForRole = (path, role) => {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return false;
  }

  if (role === "ROLE_SYSTEM_ADMIN") {
    return path.startsWith("/super-admin");
  }

  if (role === "ROLE_AIRLINE_OWNER") {
    return path.startsWith("/airline") || path.startsWith("/airline-onboarding");
  }

  return !path.startsWith("/super-admin")
    && !path.startsWith("/airline")
    && !path.startsWith("/airline-onboarding");
};

export const getSafeRedirectForRole = (role, requestedPath) => (
  isPathAllowedForRole(requestedPath, role) ? requestedPath : getRoleHome(role)
);
