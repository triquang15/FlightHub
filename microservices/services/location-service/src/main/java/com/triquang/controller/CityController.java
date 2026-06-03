package com.triquang.controller;

import com.triquang.payload.request.CityRequest;
import com.triquang.payload.response.ApiResponse;
import com.triquang.payload.response.CityResponse;
import com.triquang.payload.response.TimezoneResponse;
import com.triquang.service.CityService;
import com.triquang.service.TimezoneService;
import com.triquang.utils.ResponseUtil;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/cities")
@RequiredArgsConstructor
@Tag(name = "Cities", description = "Manage city reference data, dropdown options, country filters, and timezone lookup.")
public class CityController {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "id",
            "name",
            "cityCode",
            "countryCode",
            "countryName",
            "regionCode",
            "timeZoneId"
    );

    private final CityService cityService;
    private final TimezoneService timezoneService;

    // CREATE
    @Operation(
            summary = "Create a city",
            description = "Creates a city reference record. City code is normalized to uppercase and must be unique. Requires ROLE_SYSTEM_ADMIN through the API gateway."
    )
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "City created successfully")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid city data or duplicate city code")
    @PostMapping
    public ResponseEntity<ApiResponse<CityResponse>> createCity(
            @Valid @RequestBody CityRequest request) {
        return ResponseUtil.created(cityService.createCity(request));
    }

    // GET BY ID
    @Operation(
            summary = "Get city by ID",
            description = "Returns one city reference record by database ID."
    )
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "City found")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "City not found")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CityResponse>> getCityById(
            @Parameter(description = "City database ID", example = "1")
            @PathVariable Long id) {
        return ResponseUtil.ok(cityService.getCityById(id));
    }
    
    @Operation(
            summary = "List and filter cities",
            description = "Returns a paginated city list. Supports keyword search, country code, timezone, region, and safe sorting."
    )
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Cities returned")
    @GetMapping
    public ResponseEntity<Page<CityResponse>> getAllCities(
            @Parameter(description = "Zero-based page index", example = "0")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size, clamped from 1 to 100", example = "20")
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort field. Allowed: id, name, cityCode, countryCode, countryName, regionCode, timeZoneId", example = "name")
            @RequestParam(defaultValue = "name") String sortBy,
            @Parameter(description = "Sort direction: asc or desc", example = "asc")
            @RequestParam(defaultValue = "asc") String sortDirection,

            @Parameter(description = "Search by city name or city code", example = "ho chi")
            @RequestParam(required = false) String keyword,
            @Parameter(description = "ISO-like country code filter", example = "VN")
            @RequestParam(required = false) String country,
            @Parameter(description = "IANA timezone ID filter", example = "Asia/Ho_Chi_Minh")
            @RequestParam(required = false) String timezone,
            @Parameter(description = "Optional region code filter", example = "SEA")
            @RequestParam(required = false) String region
    ) {

        return ResponseEntity.ok(
            cityService.searchAdvanced(keyword, country, timezone, region, pageable(page, size, sortBy, sortDirection))
        );
    }

    // DROPDOWN (MAIN FE)
    @Operation(
            summary = "Get city dropdown options",
            description = "Returns all cities sorted by name for frontend dropdowns."
    )
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Dropdown cities returned")
    @GetMapping("/dropdown")
    public ResponseEntity<ApiResponse<List<CityResponse>>> getCitiesDropdown() {
        return ResponseUtil.ok(cityService.getCitiesDropdown());
    }

    // SEARCH
    @Operation(
            summary = "Search cities",
            description = "Searches cities by name or city code. Use the main list endpoint for advanced filters."
    )
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Search results returned")
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<CityResponse>>> searchCities(
            @Parameter(description = "Search by city name or city code", example = "HAN")
            @RequestParam(required = false) String keyword,
            Pageable pageable) {
        return ResponseUtil.ok(cityService.searchCities(keyword, pageable));
    }

    // BY COUNTRY
    @Operation(
            summary = "Get cities by country",
            description = "Returns cities that match a country code. Country code is normalized to uppercase."
    )
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Country cities returned")
    @GetMapping("/country/{countryCode}")
    public ResponseEntity<ApiResponse<Page<CityResponse>>> getByCountry(
            @Parameter(description = "Country code", example = "VN")
            @PathVariable String countryCode,
            Pageable pageable) {
        return ResponseUtil.ok(
                cityService.getCitiesByCountryCode(countryCode.toUpperCase(), pageable)
        );
    }

    // UPDATE
    @Operation(
            summary = "Update a city",
            description = "Updates a city reference record. City code remains globally unique. Requires ROLE_SYSTEM_ADMIN through the API gateway."
    )
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "City updated successfully")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid city data or duplicate city code")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "City not found")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CityResponse>> updateCity(
            @Parameter(description = "City database ID", example = "1")
            @PathVariable Long id,
            @Valid @RequestBody CityRequest request) {
        return ResponseUtil.ok(cityService.updateCity(id, request));
    }

    // DELETE
    @Operation(
            summary = "Delete a city",
            description = "Deletes a city reference record and clears city caches. Requires ROLE_SYSTEM_ADMIN through the API gateway."
    )
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "204", description = "City deleted successfully")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "City not found")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCity(
            @Parameter(description = "City database ID", example = "1")
            @PathVariable Long id) {
        cityService.deleteCity(id);
        return ResponseUtil.noContent();
    }
    
    @Operation(
            summary = "List supported timezones",
            description = "Returns timezone options used by city forms. Supports keyword and region filters."
    )
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Timezones returned")
    @GetMapping("/timezones")
    public ResponseEntity<List<TimezoneResponse>> getTimezones(
            @Parameter(description = "Filter by timezone ID or label", example = "Ho Chi")
            @RequestParam(required = false) String keyword,
            @Parameter(description = "Timezone region", example = "Asia")
            @RequestParam(required = false) String region
    ) {
        return ResponseEntity.ok(
                timezoneService.getAll(keyword, region)
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
