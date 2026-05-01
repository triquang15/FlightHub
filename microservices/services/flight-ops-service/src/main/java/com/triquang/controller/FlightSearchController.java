package com.triquang.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.triquang.enums.CabinClassType;
import com.triquang.payload.request.FlightSearchRequest;
import com.triquang.payload.response.FlightInstanceResponse;
import com.triquang.service.FlightSearchService;
import com.triquang.utils.ResponseUtil;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
@Slf4j
public class FlightSearchController {

    private final FlightSearchService flightSearchService;

    @GetMapping("/api/flights/search")
    public ResponseEntity<?> searchFlights(
            @RequestParam Long departureAirportId,
            @RequestParam Long arrivalAirportId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate departureDate,
            @RequestParam Integer passengers,
            @RequestParam CabinClassType cabinClass,
            @RequestParam(required = false) List<Long> airlines,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) String departureTimeRange,
            @RequestParam(required = false) String arrivalTimeRange,
            @RequestParam(required = false) Integer maxDuration,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortOrder,
            @RequestParam(required = false) String alliance,
            Pageable pageable) {

        log.info("Search flights | from={} to={} date={} passengers={} cabinClass={}",
                departureAirportId, arrivalAirportId, departureDate, passengers, cabinClass);

        var request = FlightSearchRequest.builder()
                .departureAirportId(departureAirportId)
                .arrivalAirportId(arrivalAirportId)
                .departureDate(departureDate)
                .passengers(passengers)
                .cabinClass(cabinClass)
                .airlines(airlines)
                .minPrice(minPrice)
                .maxPrice(maxPrice)
                .departureTimeRange(departureTimeRange)
                .arrivalTimeRange(arrivalTimeRange)
                .maxDuration(maxDuration)
                .alliance(alliance)
                .sortBy(sortBy)
                .sortOrder(sortOrder)
                .build();

        Page<FlightInstanceResponse> result =
                flightSearchService.searchFlights(request, pageable);

        return ResponseUtil.ok(result);
    }
}