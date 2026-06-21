package com.triquang.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import com.triquang.payload.request.FareRulesRequest;
import com.triquang.payload.response.ApiResponse;
import com.triquang.payload.response.FareRulesResponse;
import com.triquang.service.FareRulesService;
import com.triquang.utils.ResponseUtil;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;

@RestController
@RequestMapping("/api/fare-rules")
@RequiredArgsConstructor
@Tag(name = "Fare Rules", description = "Manage refund and change policies attached one-to-one to airline fares.")
public class FareRulesController {

	private final FareRulesService fareRulesService;

	// =========================
	// CREATE
	// =========================
	@PostMapping
	@Operation(summary = "Create a fare rule", description = "Creates one owner-scoped rule for a Fare that belongs to the authenticated airline.")
	@ApiResponses({
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Fare rule created"),
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request or Fare already has a rule"),
			@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Fare does not belong to the authenticated airline")
	})
	public ResponseEntity<ApiResponse<FareRulesResponse>> createFareRules(
			@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
			@Valid @RequestBody FareRulesRequest request) {

		return ResponseUtil.created(fareRulesService.createFareRules(userId, request));
	}

	// =========================
	// GET BY ID
	// =========================
	@GetMapping("/{id}")
	@Operation(summary = "Get an owned fare rule", description = "Returns a Fare Rule only when it belongs to the authenticated airline.")
	public ResponseEntity<ApiResponse<FareRulesResponse>> getFareRulesById(
			@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId, @PathVariable Long id) {

		return ResponseUtil.ok(fareRulesService.getFareRulesById(userId, id));
	}

	// =========================
	// GET BY FARE
	// =========================
	@GetMapping("/fare/{fareId}")
	@Operation(summary = "Get a fare rule by Fare", description = "Returns the customer-facing policy attached to a Fare.")
	public ResponseEntity<ApiResponse<FareRulesResponse>> getFareRulesByFareId(@PathVariable Long fareId) {

		return ResponseUtil.ok(fareRulesService.getFareRulesByFareId(fareId));
	}

	// =========================
	// GET BY AIRLINE
	// =========================
	@GetMapping("/airline")
	@Operation(summary = "List owned fare rules", description = "Lists Fare Rules for the authenticated airline owner. Airline identity is derived from the trusted user header.")
	public ResponseEntity<ApiResponse<List<FareRulesResponse>>> getFareRulesByAirlineOwner(
			@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil.ok(fareRulesService.getFareRulesByAirlineOwner(userId));
	}

	// =========================
	// UPDATE
	// =========================
	@PutMapping("/{id}")
	@Operation(summary = "Update an owned fare rule", description = "Updates policy terms without moving the rule to another Fare.")
	public ResponseEntity<ApiResponse<FareRulesResponse>> updateFareRules(
			@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId, @PathVariable Long id,
			@Valid @RequestBody FareRulesRequest request) {

		return ResponseUtil.ok(fareRulesService.updateFareRules(userId, id, request));
	}

	// =========================
	// DELETE
	// =========================
	@DeleteMapping("/{id}")
	@Operation(summary = "Delete an owned fare rule", description = "Permanently detaches and deletes the policy from its Fare.")
	public ResponseEntity<ApiResponse<Void>> deleteFareRules(
			@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId, @PathVariable Long id) {

		fareRulesService.deleteFareRules(userId, id);

		return ResponseUtil.noContent();
	}
}
