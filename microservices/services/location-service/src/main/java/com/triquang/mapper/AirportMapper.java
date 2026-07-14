package com.triquang.mapper;

import com.triquang.model.Airport;
import com.triquang.payload.request.AirportRequest;
import com.triquang.payload.response.AirportResponse;

public class AirportMapper {

    // ================= CREATE =================
    public static Airport toEntity(AirportRequest request) {
        if (request == null) return null;

        return Airport.builder()
                .iataCode(
                        request.getIataCode() != null
                                ? request.getIataCode().toUpperCase()
                                : null
                )
                .name(request.getName())

                .timeZoneId(request.getTimeZone())

                .address(request.getAddress())
                .geoCode(request.getGeoCode())
                .heroImageUrl(normalizeBlank(request.getHeroImageUrl()))
                .build();
    }

    // ================= RESPONSE =================
    public static AirportResponse toResponse(Airport airport) {
        if (airport == null) return null;

        return AirportResponse.builder()
                .id(airport.getId())
                .iataCode(airport.getIataCode())
                .name(airport.getName())
                .detailedName(airport.getDetailedName())
                .timeZone(airport.getTimeZoneId())
                .address(airport.getAddress())
                .city(
                        airport.getCity() != null
                                ? CityMapper.toResponse(airport.getCity())
                                : null
                )
                .geoCode(airport.getGeoCode())
                .analytics(airport.getAnalytics())
                .heroImageUrl(airport.getHeroImageUrl())
                .hasCustomHeroImage(airport.getHeroImageObjectKey() != null && !airport.getHeroImageObjectKey().isBlank())
                .build();
    }

    // ================= UPDATE =================
    public static void updateEntity(AirportRequest request, Airport existingAirport) {
        if (request == null || existingAirport == null) return;

        if (request.getIataCode() != null) {
            existingAirport.setIataCode(
                    request.getIataCode().toUpperCase()
            );
        }

        if (request.getName() != null) {
            existingAirport.setName(request.getName());
        }

        if (request.getTimeZone() != null) {
            existingAirport.setTimeZoneId(request.getTimeZone());
        }

        if (request.getAddress() != null) {
            existingAirport.setAddress(request.getAddress());
        }

        if (request.getGeoCode() != null) {
            existingAirport.setGeoCode(request.getGeoCode());
        }

        if (request.getHeroImageUrl() != null) {
            existingAirport.setHeroImageUrl(normalizeBlank(request.getHeroImageUrl()));
            if (!hasText(request.getHeroImageUrl())) {
                existingAirport.setHeroImageObjectKey(null);
            }
        }
    }

    private static String normalizeBlank(String value) {
        return hasText(value) ? value.trim() : null;
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
