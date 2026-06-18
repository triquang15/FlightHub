package com.triquang.mapper;

import com.triquang.model.SeatMap;
import com.triquang.model.SeatMapZone;
import com.triquang.payload.request.SeatMapZoneRequest;
import com.triquang.payload.response.SeatMapZoneResponse;

public class SeatMapZoneMapper {

    private SeatMapZoneMapper() {
    }

    public static SeatMapZone toEntity(SeatMapZoneRequest request, SeatMap seatMap) {
        return SeatMapZone.builder()
                .name(request.getName())
                .startRow(request.getStartRow())
                .endRow(request.getEndRow())
                .leftSeatsPerRow(request.getLeftSeatsPerRow())
                .rightSeatsPerRow(request.getRightSeatsPerRow())
                .seatsInLastRow(request.getSeatsInLastRow())
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .seatMap(seatMap)
                .build();
    }

    public static SeatMapZoneResponse toResponse(SeatMapZone zone) {
        return SeatMapZoneResponse.builder()
                .id(zone.getId())
                .name(zone.getName())
                .startRow(zone.getStartRow())
                .endRow(zone.getEndRow())
                .leftSeatsPerRow(zone.getLeftSeatsPerRow())
                .rightSeatsPerRow(zone.getRightSeatsPerRow())
                .seatsInLastRow(zone.getSeatsInLastRow())
                .displayOrder(zone.getDisplayOrder())
                .totalRows(zone.getRows())
                .totalSeats(zone.getTotalSeats())
                .build();
    }
}
