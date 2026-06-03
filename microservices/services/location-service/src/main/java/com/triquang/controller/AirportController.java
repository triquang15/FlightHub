package com.triquang.controller;

import com.triquang.payload.request.AirportRequest;
import com.triquang.payload.response.ApiResponse;
import com.triquang.payload.response.AirportResponse;
import com.triquang.service.AirportService;
import com.triquang.service.GeoTimezoneService;
import com.triquang.utils.ResponseUtil;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Set;

import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/airports")
@RequiredArgsConstructor
@Tag(name = "Airports", description = "Manage airport reference data, IATA codes, city mapping, and timezone detection.")
public class AirportController {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "id",
            "name",
            "iataCode",
            "timeZoneId"
    );

    private final AirportService airportService;
    private final GeoTimezoneService geoTimezoneService;

    // ================= SEARCH =================
    @Operation(
            summary = "List and filter airports",
            description = "Returns a paginated airport list. Supports keyword search by airport name or IATA code, country code filter, city filter, and safe sorting."
    )
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Airports returned")
    @GetMapping
    public ResponseEntity<Page<AirportResponse>> getAirports(
            @Parameter(description = "Zero-based page index", example = "0")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size, clamped from 1 to 100", example = "20")
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort field. Allowed: id, name, iataCode, timeZoneId", example = "name")
            @RequestParam(defaultValue = "name") String sortBy,
            @Parameter(description = "Sort direction: asc or desc", example = "asc")
            @RequestParam(defaultValue = "asc") String sortDirection,
            @Parameter(description = "Search by airport name or IATA code", example = "SGN")
            @RequestParam(required = false) String keyword,
            @Parameter(description = "Country code filter via airport city", example = "VN")
            @RequestParam(required = false) String country,
            @Parameter(description = "City database ID filter", example = "1")
            @RequestParam(required = false) Long cityId
    ) {

        return ResponseEntity.ok(
                airportService.searchAirports(keyword, country, cityId, pageable(page, size, sortBy, sortDirection))
        );
    }

    // ================= CREATE =================
    @Operation(
            summary = "Create an airport",
            description = "Creates an airport reference record. IATA code is normalized to uppercase and must be unique. If timezone is missing, the service detects it from coordinates or falls back to the city timezone. Requires ROLE_SYSTEM_ADMIN through the API gateway."
    )
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Airport created successfully")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid airport data or duplicate IATA code")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "City not found")
    @PostMapping
    public ResponseEntity<ApiResponse<AirportResponse>> createAirport(
            @Valid @RequestBody AirportRequest request
    ) {
        return ResponseUtil.created(
                airportService.createAirport(request)
        );
    }

    // ================= BULK =================
    @Operation(
            summary = "Bulk create airports",
            description = "Creates multiple airport records in one request. Existing IATA codes are skipped; new airport IATA codes are normalized to uppercase. Requires ROLE_SYSTEM_ADMIN through the API gateway."
    )
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Airports created successfully")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid airport data")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "City not found")
    @PostMapping("/bulk")
    public ResponseEntity<ApiResponse<List<AirportResponse>>> createBulkAirports(
            @Valid @RequestBody List<AirportRequest> requests
    ) {
        return ResponseUtil.created(
                airportService.createBulkAirports(requests)
        );
    }

    // ================= GET BY ID =================
    @Operation(
            summary = "Get airport by ID",
            description = "Returns one airport reference record by database ID, including city details."
    )
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Airport found")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Airport not found")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AirportResponse>> getAirport(
            @Parameter(description = "Airport database ID", example = "1")
            @PathVariable Long id
    ) {
        return ResponseUtil.ok(
                airportService.getAirportById(id)
        );
    }

    // ================= UPDATE =================
    @Operation(
            summary = "Update an airport",
            description = "Updates an airport reference record. IATA code remains globally unique. If timezone is missing, the service detects or falls back to city timezone. Requires ROLE_SYSTEM_ADMIN through the API gateway."
    )
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Airport updated successfully")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid airport data or duplicate IATA code")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Airport or city not found")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AirportResponse>> updateAirport(
            @Parameter(description = "Airport database ID", example = "1")
            @PathVariable Long id,
            @Valid @RequestBody AirportRequest request
    ) {
        return ResponseUtil.ok(
                airportService.updateAirport(id, request)
        );
    }

    // ================= DELETE =================
    @Operation(
            summary = "Delete an airport",
            description = "Deletes an airport reference record and clears airport caches. Requires ROLE_SYSTEM_ADMIN through the API gateway."
    )
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "204", description = "Airport deleted successfully")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Airport not found")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAirport(
            @Parameter(description = "Airport database ID", example = "1")
            @PathVariable Long id
    ) {
        airportService.deleteAirport(id);
        return ResponseUtil.noContent();
    }

    // ================= DETECT TIMEZONE =================
    @Operation(
            summary = "Detect timezone by coordinates",
            description = "Detects an IANA timezone ID from latitude and longitude. Used by airport forms when timezone is not manually selected."
    )
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Timezone detected")
    @GetMapping("/timezone/detect")
    public ResponseEntity<ApiResponse<String>> detectTimezone(
            @Parameter(description = "Latitude", example = "10.8188")
            @RequestParam double lat,
            @Parameter(description = "Longitude", example = "106.6519")
            @RequestParam double lng
    ) {
        return ResponseUtil.ok(
                geoTimezoneService.detect(lat, lng)
        );
    }

    private Pageable pageable(int page, int size, String sortBy, String sortDirection) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "name";
        Sort.Direction safeDirection = "desc".equalsIgnoreCase(sortDirection)
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;

        return PageRequest.of(safePage, safeSize, Sort.by(safeDirection, safeSortBy));
    }
}
