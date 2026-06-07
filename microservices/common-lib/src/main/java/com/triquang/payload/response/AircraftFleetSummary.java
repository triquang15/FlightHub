package com.triquang.payload.response;

public record AircraftFleetSummary(
        long totalAircraft,
        long activeAircraft,
        long maintenanceAircraft,
        long totalSeats
) {
}
