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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.triquang.payload.request.FlightMealRequest;
import com.triquang.service.FlightMealService;
import com.triquang.utils.ResponseUtil;

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
public class FlightMealController {

	private final FlightMealService flightMealService;

	// =========================
	// CREATE
	// =========================
	@PostMapping
	public ResponseEntity<?> createFlightMeal(@Valid @RequestBody FlightMealRequest request) {

		return ResponseUtil.created(flightMealService.create(request));
	}

	// =========================
	// BULK CREATE
	// =========================
	@PostMapping("/bulk")
	public ResponseEntity<?> bulkCreateFlightMeals(@Valid @RequestBody List<FlightMealRequest> requests) {

		return ResponseUtil.created(flightMealService.bulkCreate(requests));
	}

	// =========================
	// CALCULATE PRICE
	// =========================
	@PostMapping("/price/total")
	public ResponseEntity<?> calculateMealPrice(@RequestBody List<Long> requests) {

		return ResponseUtil.ok(flightMealService.calculateMealPrice(requests));
	}

	// =========================
	// GET BY ID
	// =========================
	@GetMapping("/{id:\\d+}")
	public ResponseEntity<?> getFlightMealById(@PathVariable Long id) {

		return ResponseUtil.ok(flightMealService.getById(id));
	}

	// =========================
	// GET BY FLIGHT
	// =========================
	@GetMapping("/flight/{flightId:\\d+}")
	public ResponseEntity<?> getMealsByFlightId(@PathVariable Long flightId) {

		return ResponseUtil.ok(flightMealService.getByFlightId(flightId));
	}

	// =========================
	// GET BY IDS
	// =========================
	@GetMapping("/all")
	public ResponseEntity<?> getMealsByIds(@RequestParam List<Long> ids) {

		return ResponseUtil.ok(flightMealService.getAllByIds(ids));
	}

	// =========================
	// UPDATE
	// =========================
	@PutMapping("/{id:\\d+}")
	public ResponseEntity<?> updateFlightMeal(@PathVariable Long id, @Valid @RequestBody FlightMealRequest request) {

		return ResponseUtil.ok(flightMealService.update(id, request));
	}

	// =========================
	// PATCH AVAILABILITY
	// =========================
	@PatchMapping("/{id:\\d+}/availability")
	public ResponseEntity<?> updateFlightMealAvailability(@PathVariable Long id, @RequestParam Boolean available) {

		return ResponseUtil.ok(flightMealService.updateAvailability(id, available));
	}

	// =========================
	// DELETE
	// =========================
	@DeleteMapping("/{id:\\d+}")
	public ResponseEntity<?> deleteFlightMeal(@PathVariable Long id) {

		flightMealService.delete(id);

		return ResponseUtil.noContent();
	}
}