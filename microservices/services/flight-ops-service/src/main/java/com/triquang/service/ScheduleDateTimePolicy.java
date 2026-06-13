package com.triquang.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

import org.springframework.stereotype.Component;

@Component
public class ScheduleDateTimePolicy {

    public LocalDateTime departure(LocalDate operationDate, LocalTime departureTime) {
        return LocalDateTime.of(operationDate, departureTime);
    }

    public LocalDateTime arrival(LocalDate operationDate, LocalTime departureTime, LocalTime arrivalTime) {
        LocalDate arrivalDate = arrivalTime.isAfter(departureTime) ? operationDate : operationDate.plusDays(1);
        return LocalDateTime.of(arrivalDate, arrivalTime);
    }

    public LocalDateTime arrival(LocalDate operationDate, LocalTime departureTime, ZoneId departureZone,
            LocalTime arrivalTime, ZoneId arrivalZone) {
        ZonedDateTime departure = ZonedDateTime.of(operationDate, departureTime, departureZone);
        ZonedDateTime arrival = ZonedDateTime.of(operationDate, arrivalTime, arrivalZone);
        while (!arrival.toInstant().isAfter(departure.toInstant())) {
            arrival = arrival.plusDays(1);
        }
        return arrival.toLocalDateTime();
    }
}
