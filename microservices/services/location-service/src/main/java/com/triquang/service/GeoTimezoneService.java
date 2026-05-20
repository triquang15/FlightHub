package com.triquang.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.iakovlev.timeshape.TimeZoneEngine;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.ZoneId;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeoTimezoneService {

    private final TimeZoneEngine engine;

    @Cacheable(
        cacheNames = "geoTimezone",
        key = "#lat + '-' + #lng",
        unless = "#result == null"
    )
    public String detect(double lat, double lng) {

        // ================= VALIDATE =================
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            log.warn("Invalid lat/lng: {}, {}", lat, lng);
            return null;
        }

        try {
            Optional<ZoneId> zone = engine.query(lat, lng);

            if (zone.isEmpty()) {
                log.warn("No timezone found for lat={} lng={}", lat, lng);
                return null;
            }

            String result = zone.get().getId();

            log.info("Timezone detected: {}", result);

            return result;

        } catch (Exception e) {
            log.error("Error detecting timezone", e);
            return null;
        }
    }
}
