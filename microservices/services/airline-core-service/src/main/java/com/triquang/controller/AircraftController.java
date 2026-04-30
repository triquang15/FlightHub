package com.triquang.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.triquang.payload.request.AircraftRequest;
import com.triquang.payload.response.AircraftResponse;
import com.triquang.payload.response.ApiResponse;
import com.triquang.service.AircraftService;
import com.triquang.utils.ResponseUtil;

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
public class AircraftController {

	private final AircraftService aircraftService;

	// ---------- CREATE ----------
	@PostMapping
	public ResponseEntity<ApiResponse<AircraftResponse>> createAircraft(@Valid @RequestBody AircraftRequest request,
			@RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil.created(aircraftService.createAircraft(request, userId));
	}

	// ---------- GET BY ID ----------
	@GetMapping("/{id}")
	public ResponseEntity<ApiResponse<AircraftResponse>> getAircraftById(@PathVariable Long id) {

		return ResponseUtil.ok(aircraftService.getAircraftById(id));
	}

	// ---------- GET MY AIRCRAFTS ----------
	@GetMapping
	public ResponseEntity<ApiResponse<List<AircraftResponse>>> listMyAircrafts(
			@RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil.ok(aircraftService.listAllAircraftsByOwner(userId));
	}

	// ---------- UPDATE ----------
	@PutMapping("/{id}")
	public ResponseEntity<ApiResponse<AircraftResponse>> updateAircraft(@PathVariable Long id,
			@Valid @RequestBody AircraftRequest request, @RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil.ok(aircraftService.updateAircraft(id, request, userId));
	}

	// ---------- DELETE ----------
	@DeleteMapping("/{id}")
	public ResponseEntity<ApiResponse<Void>> deleteAircraft(@PathVariable Long id,
			@RequestHeader("X-User-Id") Long userId) {

		aircraftService.deleteAircraft(id, userId);

		return ResponseUtil.noContent();
	}
}
