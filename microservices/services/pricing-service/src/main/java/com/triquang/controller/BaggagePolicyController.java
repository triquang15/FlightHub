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
import org.springframework.web.bind.annotation.RestController;

import com.triquang.payload.request.BaggagePolicyRequest;
import com.triquang.service.BaggagePolicyService;
import com.triquang.utils.ResponseUtil;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * Controller for managing baggage policies.
 * <p>
 * Provides endpoints to create, retrieve, update, and delete baggage policies.
 * Also supports bulk creation and retrieval by fare or airline.
 * 
 * @author Tri Quang
 * @version 1.0
 */

@RestController
@RequestMapping("/api/baggage-policies")
@RequiredArgsConstructor
@Tag(name = "Baggage Policies", description = "Manage cabin and checked baggage allowances attached to fares.")
public class BaggagePolicyController {

	private final BaggagePolicyService baggagePolicyService;

	// =========================
	// CREATE
	// =========================
	@PostMapping
	@Operation(summary = "Create a baggage policy")
	public ResponseEntity<?> createBaggagePolicy(@Valid @RequestBody BaggagePolicyRequest request) {

		return ResponseUtil.created(baggagePolicyService.createBaggagePolicy(request));
	}

	// =========================
	// BULK CREATE
	// =========================
	@PostMapping("/bulk")
	@Operation(summary = "Bulk create baggage policies")
	public ResponseEntity<?> createBaggagePolicies(@Valid @RequestBody List<BaggagePolicyRequest> requests) {

		return ResponseUtil.created(baggagePolicyService.createBaggagePolicies(requests));
	}

	// =========================
	// GET BY ID
	// =========================
	@GetMapping("/{id}")
	@Operation(summary = "Get a baggage policy by ID")
	public ResponseEntity<?> getBaggagePolicyById(@PathVariable Long id) {

		return ResponseUtil.ok(baggagePolicyService.getBaggagePolicyById(id));
	}

	// =========================
	// GET BY FARE
	// =========================
	@GetMapping("/fare/{fareId}")
	@Operation(summary = "Get a baggage policy by Fare")
	public ResponseEntity<?> getBaggagePolicyByFareId(@PathVariable Long fareId) {

		return ResponseUtil.ok(baggagePolicyService.getBaggagePolicyByFareId(fareId));
	}

	// =========================
	// GET BY AIRLINE
	// =========================
	@GetMapping("/airline/{airlineId}")
	@Operation(summary = "List baggage policies by airline")
	public ResponseEntity<?> getBaggagePoliciesByAirlineId(@PathVariable Long airlineId) {

		return ResponseUtil.ok(baggagePolicyService.getBaggagePoliciesByAirlineId(airlineId));
	}

	// =========================
	// UPDATE
	// =========================
	@PutMapping("/{id}")
	@Operation(summary = "Update a baggage policy")
	public ResponseEntity<?> updateBaggagePolicy(@PathVariable Long id,
			@Valid @RequestBody BaggagePolicyRequest request) {

		return ResponseUtil.ok(baggagePolicyService.updateBaggagePolicy(id, request));
	}

	// =========================
	// DELETE
	// =========================
	@DeleteMapping("/{id}")
	@Operation(summary = "Delete a baggage policy")
	public ResponseEntity<?> deleteBaggagePolicy(@PathVariable Long id) {

		baggagePolicyService.deleteBaggagePolicy(id);

		return ResponseUtil.noContent();
	}
}
