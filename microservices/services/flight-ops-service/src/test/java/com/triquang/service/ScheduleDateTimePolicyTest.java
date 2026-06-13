package com.triquang.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;

import org.junit.jupiter.api.Test;

class ScheduleDateTimePolicyTest {

    private final ScheduleDateTimePolicy policy = new ScheduleDateTimePolicy();

    @Test
    void movesArrivalToNextDayForOvernightFlight() {
        LocalDate operationDate = LocalDate.of(2026, 6, 13);

        assertEquals(LocalDateTime.of(2026, 6, 14, 4, 25),
                policy.arrival(operationDate, LocalTime.of(23, 55), LocalTime.of(4, 25)));
    }

    @Test
    void keepsArrivalOnOperationDateForDayFlight() {
        LocalDate operationDate = LocalDate.of(2026, 6, 13);

        assertEquals(LocalDateTime.of(2026, 6, 13, 9, 10),
                policy.arrival(operationDate, LocalTime.of(7, 0), LocalTime.of(9, 10)));
    }

    @Test
    void keepsSameLocalDateForWestboundFlightWhenArrivalInstantIsLater() {
        LocalDate operationDate = LocalDate.of(2026, 6, 13);

        assertEquals(LocalDateTime.of(2026, 6, 13, 10, 0),
                policy.arrival(operationDate, LocalTime.of(17, 0), ZoneId.of("Asia/Tokyo"),
                        LocalTime.of(10, 0), ZoneId.of("America/Los_Angeles")));
    }
}
