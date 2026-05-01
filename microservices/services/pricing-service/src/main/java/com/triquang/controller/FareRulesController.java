package com.triquang.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.triquang.payload.request.FareRulesRequest;
import com.triquang.service.FareRulesService;
import com.triquang.utils.ResponseUtil;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/fare-rules")
@RequiredArgsConstructor
public class FareRulesController {

	private final FareRulesService fareRulesService;

	// =========================
	// CREATE
	// =========================
	@PostMapping
	public ResponseEntity<?> createFareRules(@Valid @RequestBody FareRulesRequest request) {

		return ResponseUtil.created(fareRulesService.createFareRules(request));
	}

	// =========================
	// GET BY ID
	// =========================
	@GetMapping("/{id}")
	public ResponseEntity<?> getFareRulesById(@PathVariable Long id) {

		return ResponseUtil.ok(fareRulesService.getFareRulesById(id));
	}

	// =========================
	// GET BY FARE
	// =========================
	@GetMapping("/fare/{fareId}")
	public ResponseEntity<?> getFareRulesByFareId(@PathVariable Long fareId) {

		return ResponseUtil.ok(fareRulesService.getFareRulesByFareId(fareId));
	}

	// =========================
	// GET BY AIRLINE
	// =========================
	@GetMapping("/airline/{airlineId}")
	public ResponseEntity<?> getFareRulesByAirlineId(@PathVariable Long airlineId) {

		return ResponseUtil.ok(fareRulesService.getFareRulesByAirlineId(airlineId));
	}

	// =========================
	// UPDATE
	// =========================
	@PutMapping("/{id}")
	public ResponseEntity<?> updateFareRules(@PathVariable Long id, @Valid @RequestBody FareRulesRequest request) {

		return ResponseUtil.ok(fareRulesService.updateFareRules(id, request));
	}

	// =========================
	// DELETE
	// =========================
	@DeleteMapping("/{id}")
	public ResponseEntity<?> deleteFareRules(@PathVariable Long id) {

		fareRulesService.deleteFareRules(id);

		return ResponseUtil.noContent();
	}
}