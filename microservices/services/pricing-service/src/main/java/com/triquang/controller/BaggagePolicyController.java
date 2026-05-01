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
public class BaggagePolicyController {

	private final BaggagePolicyService baggagePolicyService;

	// =========================
	// CREATE
	// =========================
	@PostMapping
	public ResponseEntity<?> createBaggagePolicy(@Valid @RequestBody BaggagePolicyRequest request) {

		return ResponseUtil.created(baggagePolicyService.createBaggagePolicy(request));
	}

	// =========================
	// BULK CREATE
	// =========================
	@PostMapping("/bulk")
	public ResponseEntity<?> createBaggagePolicies(@Valid @RequestBody List<BaggagePolicyRequest> requests) {

		return ResponseUtil.created(baggagePolicyService.createBaggagePolicies(requests));
	}

	// =========================
	// GET BY ID
	// =========================
	@GetMapping("/{id}")
	public ResponseEntity<?> getBaggagePolicyById(@PathVariable Long id) {

		return ResponseUtil.ok(baggagePolicyService.getBaggagePolicyById(id));
	}

	// =========================
	// GET BY FARE
	// =========================
	@GetMapping("/fare/{fareId}")
	public ResponseEntity<?> getBaggagePolicyByFareId(@PathVariable Long fareId) {

		return ResponseUtil.ok(baggagePolicyService.getBaggagePolicyByFareId(fareId));
	}

	// =========================
	// GET BY AIRLINE
	// =========================
	@GetMapping("/airline/{airlineId}")
	public ResponseEntity<?> getBaggagePoliciesByAirlineId(@PathVariable Long airlineId) {

		return ResponseUtil.ok(baggagePolicyService.getBaggagePoliciesByAirlineId(airlineId));
	}

	// =========================
	// UPDATE
	// =========================
	@PutMapping("/{id}")
	public ResponseEntity<?> updateBaggagePolicy(@PathVariable Long id,
			@Valid @RequestBody BaggagePolicyRequest request) {

		return ResponseUtil.ok(baggagePolicyService.updateBaggagePolicy(id, request));
	}

	// =========================
	// DELETE
	// =========================
	@DeleteMapping("/{id}")
	public ResponseEntity<?> deleteBaggagePolicy(@PathVariable Long id) {

		baggagePolicyService.deleteBaggagePolicy(id);

		return ResponseUtil.noContent();
	}
}