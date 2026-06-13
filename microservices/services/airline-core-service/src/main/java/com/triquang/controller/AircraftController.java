package com.triquang.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.triquang.enums.AircraftStatus;
import com.triquang.payload.request.AircraftRequest;
import com.triquang.payload.response.AircraftFleetSummary;
import com.triquang.payload.response.AircraftResponse;
import com.triquang.payload.response.ApiResponse;
import com.triquang.service.AircraftService;
import com.triquang.utils.ResponseUtil;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import java.util.Set;
import java.util.List;

/**
 * REST controller for managing aircrafts in the airline core service.
 * <p>
 * Provides endpoints for creating, retrieving, updating, and deleting aircraft records.
 * All operations are secured and require the user ID to be passed in the request header.
 * 
 * @author Tri Quang
 */

@RestController
@RequestMapping("/api/aircrafts")
@RequiredArgsConstructor
@Tag(name = "Aircrafts", description = "Manage airline-owned aircraft, fleet availability, and maintenance data.")
public class AircraftController {

	private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
			"code", "model", "manufacturer", "seatingCapacity", "status",
			"yearOfManufacture", "nextMaintenanceDate", "createdAt", "updatedAt");

	private final AircraftService aircraftService;

	// ---------- CREATE ----------
	@PostMapping
	@Operation(summary = "Create an aircraft", description = "Adds an aircraft to an airline owned by the authenticated airline owner.")
	public ResponseEntity<ApiResponse<AircraftResponse>> createAircraft(@Valid @RequestBody AircraftRequest request,
			@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil.created(aircraftService.createAircraft(request, userId));
	}

	// ---------- GET BY ID ----------
	@GetMapping("/{id}")
	@Operation(summary = "Get an aircraft by ID", description = "Returns aircraft details when the authenticated user is authorized to view them.")
	public ResponseEntity<ApiResponse<AircraftResponse>> getAircraftById(
			@PathVariable Long id,
			@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
			@Parameter(hidden = true) @RequestHeader(value = "X-User-Roles", required = false) String roles) {

		return ResponseUtil.ok(aircraftService.getAircraftById(id, userId, roles));
	}

	// ---------- GET MY AIRCRAFTS ----------
	@GetMapping
	@Operation(summary = "Search owned aircraft", description = "Returns a paginated aircraft list scoped to the authenticated owner, with optional search and status filters.")
	public ResponseEntity<ApiResponse<Page<AircraftResponse>>> listMyAircrafts(
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "10") int size,
			@RequestParam(defaultValue = "code") String sortBy,
			@RequestParam(defaultValue = "asc") String sortDirection,
			@RequestParam(required = false) String search,
			@RequestParam(required = false) AircraftStatus status,
			@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

		String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "code";
		Sort.Direction direction = "desc".equalsIgnoreCase(sortDirection)
				? Sort.Direction.DESC
				: Sort.Direction.ASC;
		Pageable pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 100), Sort.by(direction, safeSortBy));

		return ResponseUtil.ok(aircraftService.searchAircraftsByOwner(userId, search, status, pageable));
	}

	@GetMapping("/summary")
	@Operation(summary = "Get owned fleet summary", description = "Returns fleet totals for the authenticated airline owner.")
	public ResponseEntity<ApiResponse<AircraftFleetSummary>> getFleetSummary(
			@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil.ok(aircraftService.getFleetSummary(userId));
	}

	@GetMapping("/dropdown")
	@Operation(summary = "List owned aircraft options", description = "Returns all owned aircraft for selection controls without changing fleet table pagination.")
	public ResponseEntity<ApiResponse<List<AircraftResponse>>> listAircraftOptions(
			@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil.ok(aircraftService.listAircraftOptions(userId));
	}

	// ---------- UPDATE ----------
	@PutMapping("/{id}")
	@Operation(summary = "Update an aircraft", description = "Updates an aircraft belonging to an airline owned by the authenticated airline owner.")
	public ResponseEntity<ApiResponse<AircraftResponse>> updateAircraft(@PathVariable Long id,
			@Valid @RequestBody AircraftRequest request,
			@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil.ok(aircraftService.updateAircraft(id, request, userId));
	}

	// ---------- DELETE ----------
	@DeleteMapping("/{id}")
	@Operation(summary = "Delete an aircraft", description = "Deletes an aircraft belonging to an airline owned by the authenticated airline owner.")
	public ResponseEntity<ApiResponse<Void>> deleteAircraft(@PathVariable Long id,
			@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

		aircraftService.deleteAircraft(id, userId);

		return ResponseUtil.noContent();
	}
}
