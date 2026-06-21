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
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.triquang.enums.AncillaryType;
import com.triquang.payload.request.FlightCabinAncillaryRequest;
import com.triquang.service.FlightCabinAncillaryService;
import com.triquang.utils.ResponseUtil;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Flight Cabin Ancillaries", description = "Assign sellable ancillary offers to specific flight and cabin combinations, with per-offer price, currency, availability, and quantity limits.")
public class FlightCabinAncillaryController {

	private final FlightCabinAncillaryService service;

	// =========================
	// CREATE
	// =========================
	@PostMapping
	@Operation(summary = "Assign ancillary to flight cabin", description = "Creates one sellable ancillary offer for an owned flight and a cabin class that belongs to the flight aircraft. Natural duplicates are rejected.")
	@ApiResponses({
			@ApiResponse(responseCode = "201", description = "Flight cabin ancillary created"),
			@ApiResponse(responseCode = "400", description = "Invalid price, currency, quantity, or duplicate assignment"),
			@ApiResponse(responseCode = "403", description = "Flight, cabin, or ancillary is not owned by the authenticated airline"),
			@ApiResponse(responseCode = "404", description = "Referenced flight, cabin, or ancillary not found")
	})
	public ResponseEntity<?> create(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
			@Valid @RequestBody FlightCabinAncillaryRequest request) {

		return ResponseUtil.created(service.create(userId, request));
	}

	// =========================
	// BULK CREATE
	// =========================
	@PostMapping("/bulk")
	@Operation(summary = "Bulk assign ancillaries to flight cabins", description = "Creates multiple owned offers in one request. Each item is validated against airline ownership, flight aircraft, price, currency, and duplicate natural key rules.")
	@ApiResponses({
			@ApiResponse(responseCode = "201", description = "Assignments created"),
			@ApiResponse(responseCode = "400", description = "One or more assignments are invalid"),
			@ApiResponse(responseCode = "403", description = "One or more referenced records are not owned by the airline")
	})
	public ResponseEntity<?> bulkCreate(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
			@Valid @RequestBody List<FlightCabinAncillaryRequest> requests) {

		return ResponseUtil.created(service.bulkCreate(userId, requests));
	}

	// =========================
	// GET BY ID
	// =========================
	@GetMapping("/{id:\\d+}")
	@Operation(summary = "Get flight cabin ancillary by ID", description = "Public read endpoint used by checkout and airline UI to resolve one sellable ancillary offer.")
	@ApiResponses({
			@ApiResponse(responseCode = "200", description = "Offer returned"),
			@ApiResponse(responseCode = "404", description = "Offer not found")
	})
	public ResponseEntity<?> getById(@PathVariable Long id) {

		return ResponseUtil.ok(service.getById(id));
	}

	// =========================
	// GET ALL BY IDS
	// =========================
	@GetMapping("/all")
	@Operation(summary = "Resolve flight cabin ancillaries by IDs", description = "Batch read used by booking checkout. The response includes only existing IDs; price calculation should use /price/total to enforce availability and duplicate checks.")
	@ApiResponses({
			@ApiResponse(responseCode = "200", description = "Offers returned"),
			@ApiResponse(responseCode = "400", description = "Invalid id list")
	})
	public ResponseEntity<?> getAllByIds(@RequestParam List<Long> ids) {

		return ResponseUtil.ok(service.getAllByIds(ids));
	}

	// =========================
	// GET BY FLIGHT + CABIN
	// =========================
	@GetMapping("/flight/{flightId:\\d+}/cabin/{cabinClassId}")
	@Operation(summary = "List ancillary offers for flight cabin", description = "Returns all active and inactive ancillary offers configured for a specific flight and cabin class.")
	@ApiResponses({
			@ApiResponse(responseCode = "200", description = "Offer list returned"),
			@ApiResponse(responseCode = "404", description = "Flight or cabin not found")
	})
	public ResponseEntity<?> getAllByFlightAndCabinClass(@PathVariable Long flightId, @PathVariable Long cabinClassId) {

		return ResponseUtil.ok(service.getAllByFlightAndCabinClass(flightId, cabinClassId));
	}

	// =========================
	// GET SINGLE BY TYPE
	// =========================
	@GetMapping("/flight/{flightId}/cabin/{cabinClassId}/type/{type}")
	@Operation(summary = "Get first ancillary offer by type", description = "Compatibility endpoint for clients that expect one offer for a flight cabin and ancillary type. Prefer the /type/{type}/all endpoint when multiple offers are allowed.")
	@ApiResponses({
			@ApiResponse(responseCode = "200", description = "Offer returned"),
			@ApiResponse(responseCode = "404", description = "Offer not found")
	})
	public ResponseEntity<?> getByFlightAndCabinClassAndType(@PathVariable Long flightId,
			@PathVariable Long cabinClassId, @PathVariable AncillaryType type) {

		return ResponseUtil.ok(service.getByFlightIdAndCabinClassAndType(flightId, cabinClassId, type));
	}

	// =========================
	// GET ALL BY TYPE
	// =========================
	@GetMapping("/flight/{flightId}/cabin/{cabinClassId}/type/{type}/all")
	@Operation(summary = "List ancillary offers by type", description = "Returns every offer of the requested ancillary type for a flight cabin, such as all baggage options or all insurance products.")
	@ApiResponses({
			@ApiResponse(responseCode = "200", description = "Offer list returned")
	})
	public ResponseEntity<?> getAllByFlightAndCabinClassAndType(@PathVariable Long flightId,
			@PathVariable Long cabinClassId, @PathVariable AncillaryType type) {

		return ResponseUtil.ok(service.getAllByFlightIdAndCabinClassAndType(flightId, cabinClassId, type));
	}

	// =========================
	// UPDATE
	// =========================
	@PutMapping("/{id:\\d+}")
	@Operation(summary = "Update flight cabin ancillary offer", description = "Updates price, currency, availability, inclusion, and quantity fields while preserving the original flight, cabin, and ancillary identity.")
	@ApiResponses({
			@ApiResponse(responseCode = "200", description = "Offer updated"),
			@ApiResponse(responseCode = "400", description = "Invalid commercial terms"),
			@ApiResponse(responseCode = "403", description = "Offer is not owned by the authenticated airline"),
			@ApiResponse(responseCode = "404", description = "Offer not found")
	})
	public ResponseEntity<?> update(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId, @PathVariable Long id,
			@Valid @RequestBody FlightCabinAncillaryRequest request) {

		return ResponseUtil.ok(service.update(userId, id, request));
	}

	// =========================
	// DELETE
	// =========================
	@DeleteMapping("/{id:\\d+}")
	@Operation(summary = "Delete flight cabin ancillary offer", description = "Removes an owned sellable offer from a flight cabin. Historical booking snapshots should remain in Booking Service.")
	@ApiResponses({
			@ApiResponse(responseCode = "204", description = "Offer deleted"),
			@ApiResponse(responseCode = "403", description = "Offer is not owned by the authenticated airline"),
			@ApiResponse(responseCode = "404", description = "Offer not found")
	})
	public ResponseEntity<?> delete(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId, @PathVariable Long id) {

		service.delete(userId, id);
		return ResponseUtil.noContent();
	}

	// =========================
	// CALCULATE PRICE
	// =========================
	@PostMapping("/price/total")
	@Operation(summary = "Calculate selected ancillary total", description = "Checkout endpoint. Rejects missing IDs, duplicate selected IDs, unavailable offers, and non-priced offers instead of silently undercharging.")
	@ApiResponses({
			@ApiResponse(responseCode = "200", description = "Ancillary total returned"),
			@ApiResponse(responseCode = "400", description = "Invalid, duplicate, missing, or unavailable ancillary selection")
	})
	public ResponseEntity<?> calculateAncillariesPrice(@RequestBody List<Long> flightCabinAncillaryIds) {

		return ResponseUtil.ok(service.calculateAncillaryPrice(flightCabinAncillaryIds));
	}
}
