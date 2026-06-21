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
}
