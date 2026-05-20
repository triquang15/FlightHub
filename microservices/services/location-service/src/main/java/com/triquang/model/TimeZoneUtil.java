package com.triquang.model;

import java.time.ZoneId;

public class TimeZoneUtil {

    public static ZoneId safeZone(String zoneId) {
        try {
            return zoneId != null ? ZoneId.of(zoneId) : null;
        } catch (Exception e) {
            return null;
        }
    }
}
