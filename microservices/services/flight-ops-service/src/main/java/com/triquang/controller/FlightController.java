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

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/flights")
@Tag(name = "Flights", description = "Manage airline-owned flight definitions and their lifecycle.")
@RequiredArgsConstructor
public class FlightController {

    private final FlightService flightService;

    // ---------- CREATE ----------
    @Operation(summary = "Create flight", description = "Creates an airline-owned flight definition. Requires ROLE_AIRLINE_OWNER through the API gateway.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Flight created"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid or duplicate flight"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Airline owner access required")
    })
    @PostMapping
    public ResponseEntity<ApiResponse<FlightResponse>> createFlight(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody FlightRequest request) {

        return ResponseUtil.created(
                flightService.createFlight(userId, request)
        );
    }

    // ---------- BULK CREATE ----------
    @Operation(summary = "Bulk create flights", description = "Creates multiple airline-owned flight definitions. Requires ROLE_AIRLINE_OWNER through the API gateway.")
    @PostMapping("/bulk")
    public ResponseEntity<ApiResponse<List<FlightResponse>>> createFlights(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody List<FlightRequest> requests) {

        return ResponseUtil.created(
                flightService.createFlights(userId, requests)
        );
    }

    // ---------- BATCH GET ----------
    @Operation(summary = "Get flights by IDs", description = "Returns a map of flight definitions keyed by ID.")
    @PostMapping("/batch")
    public ResponseEntity<ApiResponse<Map<Long, FlightResponse>>> getFlightsByIds(
            @RequestBody List<Long> ids) {

        return ResponseUtil.ok(
                flightService.getFlightsByIds(ids)
        );
    }

    // ---------- GET BY ID ----------
    @Operation(summary = "Get flight by ID")
    @GetMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<FlightResponse>> getFlightById(@PathVariable Long id) {

        return ResponseUtil.ok(
                flightService.getFlightById(id)
        );
    }

    // ---------- GET BY FLIGHT NUMBER ----------
    @Operation(summary = "Get flight by flight number")
    @GetMapping("/number/{flightNumber}")
    public ResponseEntity<ApiResponse<FlightResponse>> getFlightByNumber(
            @PathVariable String flightNumber) {

        return ResponseUtil.ok(
                flightService.getFlightByNumber(flightNumber)
        );
    }

    // ---------- SEARCH BY AIRLINE ----------
    @Operation(summary = "List airline flights", description = "Returns the authenticated airline owner's flights with optional route filters.")
    @GetMapping("/airline")
    public ResponseEntity<ApiResponse<Page<FlightResponse>>> getFlightsByAirline(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
            @RequestParam(required = false) Long departureAirportId,
            @RequestParam(required = false) Long arrivalAirportId,
            Pageable pageable) {

        return ResponseUtil.ok(
                flightService.getFlightsByAirline(userId, departureAirportId, arrivalAirportId, pageable)
        );
    }

    // ---------- UPDATE ----------
    @Operation(summary = "Update flight", description = "Updates an owned flight definition. Requires ROLE_AIRLINE_OWNER through the API gateway.")
    @PutMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<FlightResponse>> updateFlight(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long id,
            @Valid @RequestBody FlightRequest request) {

        return ResponseUtil.ok(
                flightService.updateFlight(userId, id, request)
        );
    }

    // ---------- CHANGE STATUS ----------
    @Operation(summary = "Change flight status", description = "Changes an owned flight definition status according to the allowed lifecycle.")
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<FlightResponse>> changeStatus(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long id,
            @RequestParam FlightStatus status) {

        return ResponseUtil.ok(
                flightService.changeStatus(userId, id, status)
        );
    }

    // ---------- DELETE ----------
    @Operation(summary = "Cancel flight", description = "Soft-cancels an owned flight definition and preserves operational history.")
    @DeleteMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<Void>> deleteFlight(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long id) {

        flightService.deleteFlight(userId, id);

        return ResponseUtil.noContent();
    }
}
