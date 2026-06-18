package com.triquang.payload.response;

public record FlightInstanceInventorySummary(
        long totalInstances,
        long liveOperations,
        long cancelledInstances
) {
}
