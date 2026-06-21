package com.triquang.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.triquang.payload.request.FareRequest;
import com.triquang.payload.response.FareResponse;
import com.triquang.service.FareService;
import com.triquang.utils.ResponseUtil;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/fares")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Fares", description = "Manage sellable fare products and query lowest prices by flight and cabin.")
public class FareController {

	private final FareService fareService;

	// =========================
	// CREATE
	// =========================
	@PostMapping
	@Operation(summary = "Create an airline-owned fare product")
	public ResponseEntity<?> createFare(
			@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
			@Valid @RequestBody FareRequest request) {
		return ResponseUtil.created(fareService.createFare(userId, request));
	}

	// =========================
	// BULK CREATE
	// =========================
	@PostMapping("/bulk")
	@Operation(summary = "Bulk create fare products", description = "Skips natural-key duplicates within the supplied flights and cabins.")
	public ResponseEntity<?> createFares(
			@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
			@Valid @RequestBody List<FareRequest> requests) {
		return ResponseUtil.created(fareService.createFares(userId, requests));
	}

	@GetMapping("/owner")
	@Operation(summary = "List fares owned by the authenticated airline")
	public ResponseEntity<?> getOwnerFares(
			@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {
		return ResponseUtil.ok(fareService.getFaresByAirlineOwner(userId));
	}

	@GetMapping("/owner/{id}")
	@Operation(summary = "Get an owned fare with its rule and baggage policy")
	public ResponseEntity<?> getOwnerFareById(
			@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
			@PathVariable Long id) {
		return ResponseUtil.ok(fareService.getOwnedFareById(userId, id));
	}

	// =========================
	// GET ALL
	// =========================
	@GetMapping
	@Operation(summary = "List all fares")
	public ResponseEntity<?> getFares() {
		return ResponseUtil.ok(fareService.getFares());
	}

	// =========================
	// GET BY ID
	// =========================
	@GetMapping("/{id}")
	@Operation(summary = "Get a fare by ID")
	public ResponseEntity<?> getFareById(@PathVariable Long id) {
		return ResponseUtil.ok(fareService.getFareById(id));
	}

	// =========================
	// GET BY FLIGHT + CABIN
	// =========================
	@GetMapping("/flight/{flightId}/cabin-class/{cabinClassId}")
	@Operation(summary = "List fares for a flight cabin")
	public ResponseEntity<?> getFaresByFlightAndCabinClass(@PathVariable Long flightId,
			@PathVariable Long cabinClassId) {

		return ResponseUtil.ok(fareService.getFaresByFlightIdAndCabinClassId(flightId, cabinClassId));
	}

	// =========================
	// UPDATE
	// =========================
	@PutMapping("/{id}")
	@Operation(summary = "Update a fare product")
	public ResponseEntity<?> updateFare(
			@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
			@PathVariable Long id, @Valid @RequestBody FareRequest request) {

		return ResponseUtil.ok(fareService.updateFare(userId, id, request));
	}

	// =========================
	// DELETE
	// =========================
	@DeleteMapping("/{id}")
	@Operation(summary = "Delete a fare product", description = "Also removes owned one-to-one Fare Rule and baggage policy records through the aggregate relationship.")
	public ResponseEntity<?> deleteFare(
			@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
			@PathVariable Long id) {

		fareService.deleteFare(userId, id);

		return ResponseUtil.noContent();
	}

	// =========================
	// BATCH BY IDS
	// =========================
	@PostMapping("/batch-by-ids")
	@Operation(summary = "Resolve fares by IDs")
	public ResponseEntity<?> getFaresByIds(@RequestBody List<Long> ids) {

		return ResponseUtil.ok(fareService.getFaresByIds(ids));
	}

	// =========================
	// SEARCH LOWEST FARE
	// =========================
	@PostMapping("/search")
	@Operation(summary = "Find the lowest fare per flight", description = "Returns a map keyed by flight ID for one cabin class.")
	public ResponseEntity<?> getLowestFarePerFlight(@RequestBody List<Long> flightIds,
			@RequestParam Long cabinClassId) {

		Map<Long, FareResponse> res = fareService.getLowestFarePerFlight(flightIds, cabinClassId);

		log.info("Search lowest fare | flightIds={} | cabinClassId={} | resultSize={}", flightIds, cabinClassId,
				res.size());

		return ResponseUtil.ok(res);
	}

	// =========================
	// GET LOWEST SINGLE
	// =========================
	@GetMapping("/lowest/flight/{flightId}/cabin-class/{cabinClassId}")
	@Operation(summary = "Find the lowest fare for one flight cabin")
	public ResponseEntity<?> getLowestFareForFlightAndCabinClass(@PathVariable Long flightId,
			@PathVariable Long cabinClassId) {

		return ResponseUtil.ok(fareService.getLowestFareForFlightAndCabin(flightId, cabinClassId));
	}
}
