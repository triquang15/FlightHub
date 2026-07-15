package com.triquang.config;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class RouteConfigSecurityTest {

    @Test
    void matchesOnlyCompleteRoleTokens() {
        assertTrue(RouteConfig.hasRole("ROLE_USER, ROLE_AIRLINE_OWNER", "ROLE_AIRLINE_OWNER"));
        assertFalse(RouteConfig.hasRole("ROLE_AIRLINE_OWNER_FAKE", "ROLE_AIRLINE_OWNER"));
        assertFalse(RouteConfig.hasRole(null, "ROLE_AIRLINE_OWNER"));
    }

    @Test
    void protectsSuperAdminBookingAnalyticsRoutes() {
        assertTrue(RouteConfig.SYSTEM_ADMIN_BOOKING_ROUTES.contains("/api/bookings/statistics/super-admin"));
        assertTrue(RouteConfig.SYSTEM_ADMIN_BOOKING_ROUTES.contains("/api/bookings/dashboard-stats/super-admin"));
        assertTrue(RouteConfig.SYSTEM_ADMIN_BOOKING_ROUTES.contains("/api/bookings/airline-performance/super-admin"));
        assertTrue(RouteConfig.SYSTEM_ADMIN_BOOKING_ROUTES.contains("/api/bookings/airport-performance/super-admin"));
        assertTrue(RouteConfig.SYSTEM_ADMIN_BOOKING_ROUTES.contains("/api/bookings/route-performance/super-admin"));
        assertFalse(RouteConfig.SYSTEM_ADMIN_BOOKING_ROUTES.contains("/api/bookings/user/history"));
    }

    @Test
    void protectsAirlineOwnerBookingOperationsRoutes() {
        assertTrue(RouteConfig.AIRLINE_OWNER_BOOKING_ROUTES.contains("/api/bookings/airline"));
        assertTrue(RouteConfig.AIRLINE_OWNER_BOOKING_ROUTES.contains("/api/bookings/statistics/airline"));
        assertTrue(RouteConfig.AIRLINE_OWNER_BOOKING_ROUTES.contains("/api/bookings/route-performance/airline"));
        assertTrue(RouteConfig.AIRLINE_OWNER_BOOKING_ROUTES.contains("/api/bookings/airport-performance/airline"));
        assertFalse(RouteConfig.AIRLINE_OWNER_BOOKING_ROUTES.contains("/api/bookings/statistics/super-admin"));
    }

    @Test
    void protectsMediaManagementRoutesButKeepsFileRouteOut() {
        assertTrue(RouteConfig.SYSTEM_ADMIN_MEDIA_ROUTES.contains("/api/media"));
        assertTrue(RouteConfig.SYSTEM_ADMIN_MEDIA_ROUTES.contains("/api/media/entity/{entityType}/{entityId}/{purpose}"));
        assertFalse(RouteConfig.SYSTEM_ADMIN_MEDIA_ROUTES.contains("/api/media/file/**"));
    }
}
