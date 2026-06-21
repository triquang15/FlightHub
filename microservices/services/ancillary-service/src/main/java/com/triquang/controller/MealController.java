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
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.triquang.payload.request.MealRequest;
import com.triquang.service.MealService;
import com.triquang.utils.ResponseUtil;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/meals")
@RequiredArgsConstructor
@Tag(name = "Meal Catalog", description = "Manage reusable airline-owned meal catalog items before assigning them to flights.")
public class MealController {

	private final MealService mealService;

	// =========================
	// CREATE
	// =========================
	@PostMapping
	@Operation(summary = "Create meal catalog item", description = "Creates a reusable meal item for the authenticated airline. Meal code uniqueness is scoped per airline.")
	@ApiResponses({
			@ApiResponse(responseCode = "201", description = "Meal created"),
			@ApiResponse(responseCode = "400", description = "Invalid meal payload or duplicate meal code"),
			@ApiResponse(responseCode = "403", description = "Authenticated user does not own an airline")
	})
	public ResponseEntity<?> createMeal(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
			@Valid @RequestBody MealRequest request) {

		return ResponseUtil.created(mealService.create(userId, request));
	}

	// =========================
	// BULK CREATE
	// =========================
	@PostMapping("/bulk")
	@Operation(summary = "Bulk create meal catalog items", description = "Creates multiple meal catalog records for the authenticated airline and validates each item.")
	@ApiResponses({
			@ApiResponse(responseCode = "201", description = "Meals created"),
			@ApiResponse(responseCode = "400", description = "One or more meal payloads are invalid")
	})
	public ResponseEntity<?> bulkCreateMeals(@Valid @RequestBody List<MealRequest> requests,
			@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil.created(mealService.bulkCreate(userId, requests));
	}

	// =========================
	// GET BY ID
	// =========================
	@GetMapping("/{id:\\d+}")
	@Operation(summary = "Get owned meal catalog item", description = "Returns one meal when it belongs to the authenticated airline owner.")
	@ApiResponses({
			@ApiResponse(responseCode = "200", description = "Meal returned"),
			@ApiResponse(responseCode = "403", description = "Meal belongs to another airline"),
			@ApiResponse(responseCode = "404", description = "Meal not found")
	})
	public ResponseEntity<?> getMealById(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
			@PathVariable Long id) {

		return ResponseUtil.ok(mealService.getById(userId, id));
	}

	// =========================
	// GET BY AIRLINE
	// =========================
	@GetMapping("/airline")
	@Operation(summary = "List owned meal catalog", description = "Returns all reusable meal items for the authenticated airline owner.")
	@ApiResponses({
			@ApiResponse(responseCode = "200", description = "Meal list returned")
	})
	public ResponseEntity<?> getMealsByAirlineId(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil.ok(mealService.getByAirlineId(userId));
	}

	// =========================
	// UPDATE
	// =========================
	@PutMapping("/{id:\\d+}")
	@Operation(summary = "Update meal catalog item", description = "Updates mutable meal details without changing the airline owner.")
	@ApiResponses({
			@ApiResponse(responseCode = "200", description = "Meal updated"),
			@ApiResponse(responseCode = "400", description = "Invalid meal payload"),
			@ApiResponse(responseCode = "403", description = "Meal belongs to another airline"),
			@ApiResponse(responseCode = "404", description = "Meal not found")
	})
	public ResponseEntity<?> updateMeal(@PathVariable Long id, @Valid @RequestBody MealRequest request,
			@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil.ok(mealService.update(userId, id, request));
	}

	// =========================
	// PATCH AVAILABILITY
	// =========================
	@PatchMapping("/{id:\\d+}/availability")
	@Operation(summary = "Change meal catalog availability", description = "Enables or disables a reusable meal catalog item for future flight assignment.")
	@ApiResponses({
			@ApiResponse(responseCode = "200", description = "Availability updated"),
			@ApiResponse(responseCode = "403", description = "Meal belongs to another airline"),
			@ApiResponse(responseCode = "404", description = "Meal not found")
	})
	public ResponseEntity<?> updateMealAvailability(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
			@PathVariable Long id, @RequestParam Boolean available) {

		return ResponseUtil.ok(mealService.updateAvailability(userId, id, available));
	}

	// =========================
	// DELETE
	// =========================
	@DeleteMapping("/{id:\\d+}")
	@Operation(summary = "Delete meal catalog item", description = "Deletes an owned meal only when it is not assigned to a flight meal offer.")
	@ApiResponses({
			@ApiResponse(responseCode = "204", description = "Meal deleted"),
			@ApiResponse(responseCode = "400", description = "Meal is in use and cannot be deleted"),
			@ApiResponse(responseCode = "403", description = "Meal belongs to another airline"),
			@ApiResponse(responseCode = "404", description = "Meal not found")
	})
	public ResponseEntity<?> deleteMeal(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId, @PathVariable Long id) {

		mealService.delete(userId, id);

		return ResponseUtil.noContent();
	}
}
