package com.triquang.service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.List;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.triquang.payload.response.TimezoneResponse;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class TimezoneService {

    @Cacheable("timezones")
    public List<TimezoneResponse> getAll(
            String keyword,
            String region
    ) {

        return ZoneId.getAvailableZoneIds().stream()

                // 🔥 filter region
                .filter(zone -> region == null || zone.startsWith(region))

                // 🔥 search
                .filter(zone -> keyword == null ||
                        zone.toLowerCase().contains(keyword.toLowerCase())
                )

                .map(this::toResponse)

                // 🔥 sort theo offset
                .sorted(Comparator.comparing(TimezoneResponse::getOffset))

                .toList();
    }

    private TimezoneResponse toResponse(String zoneId) {

        ZoneId zone = ZoneId.of(zoneId);
        ZoneOffset offset = zone.getRules().getOffset(Instant.now());

        String offsetStr = offset.getId();

        String cityName = zoneId.substring(zoneId.lastIndexOf("/") + 1)
                .replace("_", " ");

        String region = zoneId.split("/")[0];

        return TimezoneResponse.builder()
                .value(zoneId)
                .offset(offsetStr)
                .region(region)
                .label("(UTC" + offsetStr + ") " + cityName)
                .build();
    }
}
