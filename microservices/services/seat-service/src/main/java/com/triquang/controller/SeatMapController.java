package com.triquang.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.triquang.payload.request.SeatMapRequest;
import com.triquang.service.SeatMapService;
import com.triquang.utils.ResponseUtil;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/seat-maps")
@Tag(name = "Seat Maps", description = "Manage airline seat map templates, row zones, and generated physical seat layouts.")
@RequiredArgsConstructor
public class SeatMapController {

	private final SeatMapService seatMapService;

	// =========================
	// CREATE
	// =========================
	@Operation(summary = "Create seat map", description = "Creates a seat map template and generates physical seats from row zones or the fallback uniform layout.")
	@PostMapping
	public ResponseEntity<?> createSeatMap(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
			@Valid @RequestBody SeatMapRequest request) {

		return ResponseUtil.created(seatMapService.createSeatMap(userId, request));
	}

	// =========================
	// BULK CREATE
	// =========================
	@Operation(summary = "Create seat maps in bulk")
	@PostMapping("/bulk")
	public ResponseEntity<?> createSeatMaps(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
			@Valid @RequestBody List<SeatMapRequest> requests) {

		return ResponseUtil.created(seatMapService.createSeatMaps(userId, requests));
	}

	// =========================
	// GET BY ID
	// =========================
	@Operation(summary = "Get seat map by ID")
	@GetMapping("/{id}")
	public ResponseEntity<?> getSeatMapById(@PathVariable Long id) {

		return ResponseUtil.ok(seatMapService.getSeatMapById(id));
	}

	// =========================
	// GET BY CABIN CLASS
	// =========================
	@Operation(summary = "List seat maps by cabin class")
	@GetMapping("/cabin-class/{cabinClassId}")
	public ResponseEntity<?> getSeatMapsByCabinClass(@PathVariable Long cabinClassId) {

		return ResponseUtil.ok(seatMapService.getSeatMapsByCabinClass(cabinClassId));
	}

	// =========================
	// UPDATE
	// =========================
	@Operation(summary = "Update seat map")
	@PutMapping("/{id}")
	public ResponseEntity<?> updateSeatMap(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId, @PathVariable Long id,
			@Valid @RequestBody SeatMapRequest request) {

		return ResponseUtil.ok(seatMapService.updateSeatMap(userId, id, request));
	}

	// =========================
	// DELETE
	// =========================
	@Operation(summary = "Delete seat map")
	@DeleteMapping("/{id}")
	public ResponseEntity<?> deleteSeatMap(@PathVariable Long id) {

		seatMapService.deleteSeatMap(id);

		return ResponseUtil.noContent();
	}
}
