package com.triquang.model;

import java.util.Locale;

public enum MediaEntityType {
    USER_PROFILE,
    AIRLINE,
    MEAL,
    ANCILLARY,
    AIRPORT,
    ROUTE,
    LANDING;

    public static MediaEntityType from(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("entityType is required");
        }
        try {
            return MediaEntityType.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Unsupported media entityType: " + value, ex);
        }
    }
}
