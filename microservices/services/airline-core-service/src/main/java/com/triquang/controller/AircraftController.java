package com.triquang.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.triquang.payload.request.AircraftRequest;
import com.triquang.payload.response.AircraftResponse;
import com.triquang.payload.response.ApiResponse;
import com.triquang.service.AircraftService;
import com.triquang.utils.ResponseUtil;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

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
			@Parameter(hidden = true) @RequestHeader(value = "X-User-Id", required = false) Long userId,
			@Parameter(hidden = true) @RequestHeader(value = "X-User-Roles", required = false) String roles) {

		return ResponseUtil.ok(aircraftService.getAircraftById(id, userId, roles));
	}

	// ---------- GET MY AIRCRAFTS ----------
	@GetMapping
	@Operation(summary = "List owned aircraft", description = "Returns all aircraft belonging to airlines owned by the authenticated airline owner.")
	public ResponseEntity<ApiResponse<List<AircraftResponse>>> listMyAircrafts(
			@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil.ok(aircraftService.listAllAircraftsByOwner(userId));
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
