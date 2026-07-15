package com.triquang.model;

import java.util.Locale;

public enum MediaPurpose {
    AVATAR,
    LOGO,
    IMAGE,
    ICON,
    HERO,
    THUMBNAIL,
    DOCUMENT;

    public static MediaPurpose from(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("purpose is required");
        }
        try {
            return MediaPurpose.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Unsupported media purpose: " + value, ex);
        }
    }
}
