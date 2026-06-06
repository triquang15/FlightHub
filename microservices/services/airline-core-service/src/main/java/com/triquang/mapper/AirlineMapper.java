package com.triquang.mapper;

import com.triquang.embeddable.Support;
import com.triquang.enums.AirlineStatus;
import com.triquang.model.Airline;
import com.triquang.payload.request.AirlineRequest;
import com.triquang.payload.response.AirlineResponse;

public class AirlineMapper {

    // ================= CREATE =================
    public static Airline toEntity(AirlineRequest request, Long ownerId) {
        if (request == null) return null;

        Airline airline = Airline.builder()
                .iataCode(toUpper(request.getIataCode()))
                .icaoCode(toUpper(request.getIcaoCode()))
                .name(trim(request.getName()))
                .alias(trim(request.getAlias()))
                .logoUrl(request.getLogoUrl())
                .website(request.getWebsite())
                .status(AirlineStatus.INACTIVE)
                .alliance(trim(request.getAlliance()))
                .headquartersCityId(request.getHeadquartersCityId())
                .ownerId(ownerId)
                .build();

        if (hasSupport(request)) {
            airline.setSupport(Support.builder()
                    .email(trim(request.getSupportEmail()))
                    .phone(trim(request.getSupportPhone()))
                    .hours(trim(request.getSupportHours()))
                    .build());
        }

        return airline;
    }

    // ================= RESPONSE =================
    public static AirlineResponse toResponse(Airline airline) {
        if (airline == null) return null;

        return AirlineResponse.builder()
                .id(airline.getId())
                .iataCode(airline.getIataCode())
                .icaoCode(airline.getIcaoCode())
                .name(airline.getName())
                .alias(airline.getAlias())
                .logoUrl(airline.getLogoUrl())
                .website(airline.getWebsite())
                .status(airline.getStatus())
                .alliance(airline.getAlliance())
                .support(airline.getSupport())
                .headquartersCityId(airline.getHeadquartersCityId())
                .createdAt(airline.getCreatedAt())
                .updatedAt(airline.getUpdatedAt())
                .ownerId(airline.getOwnerId())
                .updatedById(airline.getUpdatedById())
                .build();
    }

    // ================= UPDATE =================
    public static void updateEntity(Airline airline, AirlineRequest request) {
        if (airline == null || request == null) return;

        if (request.getIataCode() != null) {
            airline.setIataCode(toUpper(request.getIataCode()));
        }

        if (request.getIcaoCode() != null) {
            airline.setIcaoCode(toUpper(request.getIcaoCode()));
        }

        if (request.getName() != null) {
            airline.setName(trim(request.getName()));
        }

        if (request.getAlias() != null) {
            airline.setAlias(trim(request.getAlias()));
        }

        if (request.getLogoUrl() != null) {
            airline.setLogoUrl(request.getLogoUrl());
        }

        if (request.getWebsite() != null) {
            airline.setWebsite(request.getWebsite());
        }

        if (request.getAlliance() != null) {
            airline.setAlliance(trim(request.getAlliance()));
        }

        if (request.getHeadquartersCityId() != null) {
            airline.setHeadquartersCityId(request.getHeadquartersCityId());
        }

        // support
        if (airline.getSupport() == null) {
            airline.setSupport(new Support());
        }

        if (request.getSupportEmail() != null) {
            airline.getSupport().setEmail(trim(request.getSupportEmail()));
        }

        if (request.getSupportPhone() != null) {
            airline.getSupport().setPhone(trim(request.getSupportPhone()));
        }

        if (request.getSupportHours() != null) {
            airline.getSupport().setHours(trim(request.getSupportHours()));
        }
    }

    // ================= HELPER =================
    private static boolean hasSupport(AirlineRequest request) {
        return request.getSupportEmail() != null
                || request.getSupportPhone() != null
                || request.getSupportHours() != null;
    }

    private static String trim(String val) {
        return val != null ? val.trim() : null;
    }

    private static String toUpper(String val) {
        return val != null ? val.trim().toUpperCase() : null;
    }
}
