package com.triquang.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.triquang.payload.request.FlightInstanceCabinRequest;
import com.triquang.payload.response.FlightInstanceCabinResponse;
import com.triquang.service.FlightInstanceCabinService;
import com.triquang.utils.ResponseUtil;

@RestController
@RequestMapping("/api/flight-instance-cabins")
@RequiredArgsConstructor
public class FlightInstanceCabinController {

	private final FlightInstanceCabinService flightInstanceCabinService;

	// =========================
	// CREATE
	// =========================
	@PostMapping
	public ResponseEntity<?> createFlightInstanceCabin(@Valid @RequestBody FlightInstanceCabinRequest request) {

		return ResponseUtil.created(flightInstanceCabinService.createFlightInstanceCabin(request));
	}

	// =========================
	// GET BY ID
	// =========================
	@GetMapping("/{id}")
	public ResponseEntity<?> getFlightInstanceCabinById(@PathVariable Long id) {

		return ResponseUtil.ok(flightInstanceCabinService.getFlightInstanceCabinById(id));
	}

	// =========================
	// GET BY FLIGHT + CABIN
	// =========================
	@GetMapping("/flight-instance/{flightInstanceId}/cabin-class/{cabinClassId}")
	public ResponseEntity<?> getByFlightInstanceIdAndCabinClassId(@PathVariable Long flightInstanceId,
			@PathVariable Long cabinClassId) {

		return ResponseUtil
				.ok(flightInstanceCabinService.getByFlightInstanceIdAndCabinClassId(flightInstanceId, cabinClassId));
	}

	// =========================
	// GET BY FLIGHT (PAGINATION)
	// =========================
	@GetMapping("/flight-instance/{flightInstanceId}")
	public ResponseEntity<?> getByFlightInstanceId(@PathVariable Long flightInstanceId, Pageable pageable) {

		Page<FlightInstanceCabinResponse> result = flightInstanceCabinService.getByFlightInstanceId(flightInstanceId,
				pageable);

		return ResponseUtil.ok(result);
	}

	// =========================
	// UPDATE
	// =========================
	@PutMapping("/{id}")
	public ResponseEntity<?> updateFlightInstanceCabin(@PathVariable Long id,
			@Valid @RequestBody FlightInstanceCabinRequest request) {

		return ResponseUtil.ok(flightInstanceCabinService.updateFlightInstanceCabin(id, request));
	}

	// =========================
	// DELETE
	// =========================
	@DeleteMapping("/{id}")
	public ResponseEntity<?> deleteFlightInstanceCabin(@PathVariable Long id) {

		flightInstanceCabinService.deleteFlightInstanceCabin(id);

		return ResponseUtil.noContent();
	}
}