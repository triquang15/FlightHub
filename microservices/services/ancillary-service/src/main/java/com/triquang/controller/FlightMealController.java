package com.triquang.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.triquang.payload.request.FlightMealRequest;
import com.triquang.service.FlightMealService;
import com.triquang.utils.ResponseUtil;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * FlightMealController manages meal options for flights. It allows airline staff to create, retrieve, update, and delete meal options for specific flights.
 * It also provides functionality to calculate the total price of selected meals.
 * 
 * @author Tri Quang
 * @version 1.0
 */

@RestController
@RequestMapping("/api/flight-meals")
@RequiredArgsConstructor
@Tag(name = "Flight Meals", description = "Assign airline meal catalog items to specific flights with per-flight price, currency, and availability.")
public class FlightMealController {

	private final FlightMealService flightMealService;

	// =========================
	// CREATE
	// =========================
	@PostMapping
	@Operation(summary = "Assign meal to flight", description = "Creates a sellable meal option for an owned flight. The meal catalog item must belong to the same authenticated airline.")
	@ApiResponses({
			@ApiResponse(responseCode = "201", description = "Flight meal created"),
			@ApiResponse(responseCode = "400", description = "Invalid price, currency, or duplicate assignment"),
			@ApiResponse(responseCode = "403", description = "Flight or meal is not owned by the authenticated airline"),
			@ApiResponse(responseCode = "404", description = "Referenced flight or meal not found")
	})
	public ResponseEntity<?> createFlightMeal(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
			@Valid @RequestBody FlightMealRequest request) {

		return ResponseUtil.created(flightMealService.create(userId, request));
	}

	// =========================
	// BULK CREATE
	// =========================
	@PostMapping("/bulk")
	@Operation(summary = "Bulk assign meals to flights", description = "Creates multiple flight meal offers after validating airline ownership, price, currency, and natural-key duplicates.")
	@ApiResponses({
			@ApiResponse(responseCode = "201", description = "Flight meals created"),
			@ApiResponse(responseCode = "400", description = "One or more flight meal offers are invalid"),
			@ApiResponse(responseCode = "403", description = "One or more referenced records are not owned by the airline")
	})
	public ResponseEntity<?> bulkCreateFlightMeals(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
			@Valid @RequestBody List<FlightMealRequest> requests) {

		return ResponseUtil.created(flightMealService.bulkCreate(userId, requests));
	}

	// =========================
	// CALCULATE PRICE
	// =========================
	@PostMapping("/price/total")
	@Operation(summary = "Calculate selected meal total", description = "Checkout endpoint. Rejects missing IDs and unavailable meals. Duplicate selected IDs are priced as quantities for multi-passenger checkout.")
	@ApiResponses({
			@ApiResponse(responseCode = "200", description = "Meal total returned"),
			@ApiResponse(responseCode = "400", description = "Invalid, missing, or unavailable meal selection")
	})
	public ResponseEntity<?> calculateMealPrice(@RequestBody List<Long> requests) {

		return ResponseUtil.ok(flightMealService.calculateMealPrice(requests));
	}

	// =========================
	// GET BY ID
	// =========================
	@GetMapping("/{id:\\d+}")
	@Operation(summary = "Get flight meal by ID", description = "Returns one flight-specific meal offer.")
	@ApiResponses({
			@ApiResponse(responseCode = "200", description = "Flight meal returned"),
			@ApiResponse(responseCode = "404", description = "Flight meal not found")
	})
	public ResponseEntity<?> getFlightMealById(@PathVariable Long id) {

		return ResponseUtil.ok(flightMealService.getById(id));
	}

	// =========================
	// GET BY FLIGHT
	// =========================
	@GetMapping("/flight/{flightId:\\d+}")
	@Operation(summary = "List meals for flight", description = "Returns meal offers configured for a specific flight.")
	@ApiResponses({
			@ApiResponse(responseCode = "200", description = "Meal offer list returned")
	})
	public ResponseEntity<?> getMealsByFlightId(@PathVariable Long flightId) {

		return ResponseUtil.ok(flightMealService.getByFlightId(flightId));
	}

	// =========================
	// GET BY IDS
	// =========================
	@GetMapping("/all")
	@Operation(summary = "Resolve flight meals by IDs", description = "Batch read used by checkout and booking detail pages.")
	@ApiResponses({
			@ApiResponse(responseCode = "200", description = "Flight meals returned"),
			@ApiResponse(responseCode = "400", description = "Invalid id list")
	})
	public ResponseEntity<?> getMealsByIds(@RequestParam List<Long> ids) {

		return ResponseUtil.ok(flightMealService.getAllByIds(ids));
	}

	// =========================
	// UPDATE
	// =========================
	@PutMapping("/{id:\\d+}")
	@Operation(summary = "Update flight meal offer", description = "Updates price, currency, and availability while preserving the original flight and meal identity.")
	@ApiResponses({
			@ApiResponse(responseCode = "200", description = "Flight meal updated"),
			@ApiResponse(responseCode = "400", description = "Invalid commercial terms"),
			@ApiResponse(responseCode = "403", description = "Flight meal is not owned by the authenticated airline"),
			@ApiResponse(responseCode = "404", description = "Flight meal not found")
	})
	public ResponseEntity<?> updateFlightMeal(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId, @PathVariable Long id,
			@Valid @RequestBody FlightMealRequest request) {

		return ResponseUtil.ok(flightMealService.update(userId, id, request));
	}

	// =========================
	// PATCH AVAILABILITY
	// =========================
	@PatchMapping("/{id:\\d+}/availability")
	@Operation(summary = "Change flight meal availability", description = "Enables or disables a meal for new bookings without deleting the historical offer.")
	@ApiResponses({
			@ApiResponse(responseCode = "200", description = "Availability updated"),
			@ApiResponse(responseCode = "403", description = "Flight meal is not owned by the authenticated airline"),
			@ApiResponse(responseCode = "404", description = "Flight meal not found")
	})
	public ResponseEntity<?> updateFlightMealAvailability(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
			@PathVariable Long id, @RequestParam Boolean available) {

		return ResponseUtil.ok(flightMealService.updateAvailability(userId, id, available));
	}

	// =========================
	// DELETE
	// =========================
	@DeleteMapping("/{id:\\d+}")
	@Operation(summary = "Delete flight meal offer", description = "Removes an owned meal offer from future sale. Booking history should keep its own commercial snapshot.")
	@ApiResponses({
			@ApiResponse(responseCode = "204", description = "Flight meal deleted"),
			@ApiResponse(responseCode = "403", description = "Flight meal is not owned by the authenticated airline"),
			@ApiResponse(responseCode = "404", description = "Flight meal not found")
	})
	public ResponseEntity<?> deleteFlightMeal(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId, @PathVariable Long id) {

		flightMealService.delete(userId, id);

		return ResponseUtil.noContent();
	}
}
