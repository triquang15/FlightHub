package com.triquang.controller;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.triquang.enums.FlightStatus;
import com.triquang.payload.request.FlightRequest;
import com.triquang.payload.response.ApiResponse;
import com.triquang.payload.response.FlightResponse;
import com.triquang.service.FlightService;
import com.triquang.utils.ResponseUtil;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/flights")
@RequiredArgsConstructor
public class FlightController {

    private final FlightService flightService;

    // ---------- CREATE ----------
    @PostMapping
    public ResponseEntity<ApiResponse<FlightResponse>> createFlight(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody FlightRequest request) {

        return ResponseUtil.created(
                flightService.createFlight(userId, request)
        );
    }

    // ---------- BULK CREATE ----------
    @PostMapping("/bulk")
    public ResponseEntity<ApiResponse<List<FlightResponse>>> createFlights(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody List<FlightRequest> requests) {

        return ResponseUtil.created(
                flightService.createFlights(userId, requests)
        );
    }

    // ---------- BATCH GET ----------
    @PostMapping("/batch")
    public ResponseEntity<ApiResponse<Map<Long, FlightResponse>>> getFlightsByIds(
            @RequestBody List<Long> ids) {

        return ResponseUtil.ok(
                flightService.getFlightsByIds(ids)
        );
    }

    // ---------- GET BY ID ----------
    @GetMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<FlightResponse>> getFlightById(@PathVariable Long id) {

        return ResponseUtil.ok(
                flightService.getFlightById(id)
        );
    }

    // ---------- GET BY FLIGHT NUMBER ----------
    @GetMapping("/number/{flightNumber}")
    public ResponseEntity<ApiResponse<FlightResponse>> getFlightByNumber(
            @PathVariable String flightNumber) {

        return ResponseUtil.ok(
                flightService.getFlightByNumber(flightNumber)
        );
    }

    // ---------- SEARCH BY AIRLINE ----------
    @GetMapping("/airline")
    public ResponseEntity<ApiResponse<Page<FlightResponse>>> getFlightsByAirline(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(required = false) Long departureAirportId,
            @RequestParam(required = false) Long arrivalAirportId,
            Pageable pageable) {

        return ResponseUtil.ok(
                flightService.getFlightsByAirline(userId, departureAirportId, arrivalAirportId, pageable)
        );
    }

    // ---------- UPDATE ----------
    @PutMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<FlightResponse>> updateFlight(
            @PathVariable Long id,
            @Valid @RequestBody FlightRequest request) {

        return ResponseUtil.ok(
                flightService.updateFlight(id, request)
        );
    }

    // ---------- CHANGE STATUS ----------
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<FlightResponse>> changeStatus(
            @PathVariable Long id,
            @RequestParam FlightStatus status) {

        return ResponseUtil.ok(
                flightService.changeStatus(id, status)
        );
    }

    // ---------- DELETE ----------
    @DeleteMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<Void>> deleteFlight(@PathVariable Long id) {

        flightService.deleteFlight(id);

        return ResponseUtil.noContent();
    }
}
