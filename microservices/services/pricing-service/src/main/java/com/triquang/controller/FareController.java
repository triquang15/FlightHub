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

@RestController
@RequestMapping("/api/fares")
@RequiredArgsConstructor
@Slf4j
public class FareController {

	private final FareService fareService;

	// =========================
	// CREATE
	// =========================
	@PostMapping
	public ResponseEntity<?> createFare(@Valid @RequestBody FareRequest request) {
		return ResponseUtil.created(fareService.createFare(request));
	}

	// =========================
	// BULK CREATE
	// =========================
	@PostMapping("/bulk")
	public ResponseEntity<?> createFares(@Valid @RequestBody List<FareRequest> requests) {
		return ResponseUtil.created(fareService.createFares(requests));
	}

	// =========================
	// GET ALL
	// =========================
	@GetMapping
	public ResponseEntity<?> getFares() {
		return ResponseUtil.ok(fareService.getFares());
	}

	// =========================
	// GET BY ID
	// =========================
	@GetMapping("/{id}")
	public ResponseEntity<?> getFareById(@PathVariable Long id) {
		return ResponseUtil.ok(fareService.getFareById(id));
	}

	// =========================
	// GET BY FLIGHT + CABIN
	// =========================
	@GetMapping("/flight/{flightId}/cabin-class/{cabinClassId}")
	public ResponseEntity<?> getFaresByFlightAndCabinClass(@PathVariable Long flightId,
			@PathVariable Long cabinClassId) {

		return ResponseUtil.ok(fareService.getFaresByFlightIdAndCabinClassId(flightId, cabinClassId));
	}

	// =========================
	// UPDATE
	// =========================
	@PutMapping("/{id}")
	public ResponseEntity<?> updateFare(@PathVariable Long id, @Valid @RequestBody FareRequest request) {

		return ResponseUtil.ok(fareService.updateFare(id, request));
	}

	// =========================
	// DELETE
	// =========================
	@DeleteMapping("/{id}")
	public ResponseEntity<?> deleteFare(@PathVariable Long id) {

		fareService.deleteFare(id);

		return ResponseUtil.noContent();
	}

	// =========================
	// BATCH BY IDS
	// =========================
	@PostMapping("/batch-by-ids")
	public ResponseEntity<?> getFaresByIds(@RequestBody List<Long> ids) {

		return ResponseUtil.ok(fareService.getFaresByIds(ids));
	}

	// =========================
	// SEARCH LOWEST FARE
	// =========================
	@PostMapping("/search")
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
	public ResponseEntity<?> getLowestFareForFlightAndCabinClass(@PathVariable Long flightId,
			@PathVariable Long cabinClassId) {

		return ResponseUtil.ok(fareService.getLowestFareForFlightAndCabin(flightId, cabinClassId));
	}
}