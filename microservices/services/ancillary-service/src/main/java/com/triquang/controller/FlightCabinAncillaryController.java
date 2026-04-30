package com.triquang.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.triquang.enums.AncillaryType;
import com.triquang.payload.request.FlightCabinAncillaryRequest;
import com.triquang.service.FlightCabinAncillaryService;
import com.triquang.utils.ResponseUtil;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * FlightCabinAncillaryController manages ancillary services specific to flight cabins.
 * It allows airline staff to create, retrieve, update, and delete ancillary services for specific flights and cabin classes.
 * 
 * @author Tri Quang
 * @version 1.0
 */

@RestController
@RequestMapping("/api/flight-cabin-ancillaries")
@RequiredArgsConstructor
public class FlightCabinAncillaryController {

	private final FlightCabinAncillaryService service;

	// =========================
	// CREATE
	// =========================
	@PostMapping
	public ResponseEntity<?> create(@Valid @RequestBody FlightCabinAncillaryRequest request) {

		return ResponseUtil.created(service.create(request));
	}

	// =========================
	// BULK CREATE
	// =========================
	@PostMapping("/bulk")
	public ResponseEntity<?> bulkCreate(@Valid @RequestBody List<FlightCabinAncillaryRequest> requests) {

		return ResponseUtil.created(service.bulkCreate(requests));
	}

	// =========================
	// GET BY ID
	// =========================
	@GetMapping("/{id:\\d+}")
	public ResponseEntity<?> getById(@PathVariable Long id) {

		return ResponseUtil.ok(service.getById(id));
	}

	// =========================
	// GET ALL BY IDS
	// =========================
	@GetMapping("/all")
	public ResponseEntity<?> getAllByIds(@RequestParam List<Long> ids) {

		return ResponseUtil.ok(service.getAllByIds(ids));
	}

	// =========================
	// GET BY FLIGHT + CABIN
	// =========================
	@GetMapping("/flight/{flightId:\\d+}/cabin/{cabinClassId}")
	public ResponseEntity<?> getAllByFlightAndCabinClass(@PathVariable Long flightId, @PathVariable Long cabinClassId) {

		return ResponseUtil.ok(service.getAllByFlightAndCabinClass(flightId, cabinClassId));
	}

	// =========================
	// GET SINGLE BY TYPE
	// =========================
	@GetMapping("/flight/{flightId}/cabin/{cabinClassId}/type/{type}")
	public ResponseEntity<?> getByFlightAndCabinClassAndType(@PathVariable Long flightId,
			@PathVariable Long cabinClassId, @PathVariable AncillaryType type) {

		return ResponseUtil.ok(service.getByFlightIdAndCabinClassAndType(flightId, cabinClassId, type));
	}

	// =========================
	// GET ALL BY TYPE
	// =========================
	@GetMapping("/flight/{flightId}/cabin/{cabinClassId}/type/{type}/all")
	public ResponseEntity<?> getAllByFlightAndCabinClassAndType(@PathVariable Long flightId,
			@PathVariable Long cabinClassId, @PathVariable AncillaryType type) {

		return ResponseUtil.ok(service.getAllByFlightIdAndCabinClassAndType(flightId, cabinClassId, type));
	}

	// =========================
	// UPDATE
	// =========================
	@PutMapping("/{id:\\d+}")
	public ResponseEntity<?> update(@PathVariable Long id, @Valid @RequestBody FlightCabinAncillaryRequest request) {

		return ResponseUtil.ok(service.update(id, request));
	}

	// =========================
	// DELETE
	// =========================
	@DeleteMapping("/{id:\\d+}")
	public ResponseEntity<?> delete(@PathVariable Long id) {

		service.delete(id);
		return ResponseUtil.noContent();
	}

	// =========================
	// CALCULATE PRICE
	// =========================
	@PostMapping("/price/total")
	public ResponseEntity<?> calculateAncillariesPrice(@RequestBody List<Long> flightCabinAncillaryIds) {

		return ResponseUtil.ok(service.calculateAncillaryPrice(flightCabinAncillaryIds));
	}
}