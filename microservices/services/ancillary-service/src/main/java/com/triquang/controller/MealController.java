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

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/meals")
@RequiredArgsConstructor
public class MealController {

	private final MealService mealService;

	// =========================
	// CREATE
	// =========================
	@PostMapping
	public ResponseEntity<?> createMeal(@RequestHeader("X-User-Id") Long userId,
			@Valid @RequestBody MealRequest request) {

		return ResponseUtil.created(mealService.create(userId, request));
	}

	// =========================
	// BULK CREATE
	// =========================
	@PostMapping("/bulk")
	public ResponseEntity<?> bulkCreateMeals(@Valid @RequestBody List<MealRequest> requests,
			@RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil.created(mealService.bulkCreate(userId, requests));
	}

	// =========================
	// GET BY ID
	// =========================
	@GetMapping("/{id:\\d+}")
	public ResponseEntity<?> getMealById(@PathVariable Long id) {

		return ResponseUtil.ok(mealService.getById(id));
	}

	// =========================
	// GET BY AIRLINE
	// =========================
	@GetMapping("/airline")
	public ResponseEntity<?> getMealsByAirlineId(@RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil.ok(mealService.getByAirlineId(userId));
	}

	// =========================
	// UPDATE
	// =========================
	@PutMapping("/{id:\\d+}")
	public ResponseEntity<?> updateMeal(@PathVariable Long id, @Valid @RequestBody MealRequest request,
			@RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil.ok(mealService.update(userId, id, request));
	}

	// =========================
	// PATCH AVAILABILITY
	// =========================
	@PatchMapping("/{id:\\d+}/availability")
	public ResponseEntity<?> updateMealAvailability(@PathVariable Long id, @RequestParam Boolean available) {

		return ResponseUtil.ok(mealService.updateAvailability(id, available));
	}

	// =========================
	// DELETE
	// =========================
	@DeleteMapping("/{id:\\d+}")
	public ResponseEntity<?> deleteMeal(@PathVariable Long id) {

		mealService.delete(id);

		return ResponseUtil.noContent();
	}
}