package com.triquang.controller;

import java.util.List;

/**
 * REST controller for managing airlines.
 * <p>
 * Provides endpoints for creating, retrieving, updating, and deleting airlines,
 * as well as administrative actions like approving, suspending, and banning airlines.
 * <p>
 * All endpoints return a standardized ApiResponse wrapper for consistent API responses.
 * 
 * @author Tri Quang
 */

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.triquang.enums.AirlineStatus;
import com.triquang.enums.ErrorCode;
import com.triquang.enums.UserRole;
import com.triquang.exception.BaseException;
import com.triquang.payload.request.AirlineRequest;
import com.triquang.payload.response.AirlineDropdownItem;
import com.triquang.payload.response.AirlineResponse;
import com.triquang.payload.response.ApiResponse;
import com.triquang.service.AirlineService;
import com.triquang.utils.ResponseUtil;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/airlines")
@RequiredArgsConstructor
public class AirlineController {

	private final AirlineService airlineService;

	// ---------- CREATE ----------
	@PostMapping
	public ResponseEntity<ApiResponse<AirlineResponse>> createAirline(@Valid @RequestBody AirlineRequest request,
			@RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil.created(airlineService.createAirline(request, userId));
	}

	// ---------- MY AIRLINES ----------
	@GetMapping("/admin")
	public ResponseEntity<ApiResponse<List<AirlineResponse>>> getAirlineByOwner(@RequestHeader("X-User-Id") Long userId) {
		return ResponseUtil.ok(airlineService.getAirlinesByOwner(userId));
	}

	// ---------- GET BY ID ----------
	@GetMapping("/{id}")
	public ResponseEntity<ApiResponse<AirlineResponse>> getAirlineById(@PathVariable Long id) {
		return ResponseUtil.ok(airlineService.getAirlineById(id));
	}

	// ---------- GET ALL ----------
	@GetMapping
	public ResponseEntity<ApiResponse<Page<AirlineResponse>>> getAllAirlines(
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size,
			@RequestParam(defaultValue = "name") String sortBy,
			@RequestParam(defaultValue = "asc") String sortDirection,
			@RequestParam(required = false) String keyword,
			@RequestParam(required = false) AirlineStatus status) {

		Sort sort = Sort.by(Sort.Direction.fromString(sortDirection), sortBy);
		Pageable pageable = PageRequest.of(page, size, sort);

		return ResponseUtil.ok(airlineService.searchAdvanced(keyword, status, pageable));
	}

	// ---------- DROPDOWN ----------
	@GetMapping("/dropdown")
	public ResponseEntity<ApiResponse<List<AirlineDropdownItem>>> getAirlinesForDropdown() {

		return ResponseUtil.ok(airlineService.getAirlinesForDropdown());
	}

	// ---------- UPDATE ----------
	@PutMapping("/{id}")
	public ResponseEntity<ApiResponse<AirlineResponse>> updateAirline(@PathVariable Long id,
			@Valid @RequestBody AirlineRequest request, @RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil.ok(airlineService.updateAirline(id, request, userId));
	}

	// ---------- DELETE ----------
	@DeleteMapping("/{id}")
	public ResponseEntity<ApiResponse<Void>> deleteAirline(@PathVariable Long id,
			@RequestHeader("X-User-Id") Long userId) {

		airlineService.deleteAirline(id, userId);

		return ResponseUtil.noContent();
	}

	// ---------- ADMIN ----------
	@PostMapping("/{id}/approve")
	public ResponseEntity<ApiResponse<AirlineResponse>> approveAirline(
			@PathVariable Long id,
			@RequestHeader(value = "X-User-Roles", required = false) String roles) {
		requireSystemAdmin(roles);
		return ResponseUtil.ok(airlineService.changeStatusByAdmin(id, AirlineStatus.ACTIVE));
	}

	@PostMapping("/{id}/suspend")
	public ResponseEntity<ApiResponse<AirlineResponse>> suspendAirline(
			@PathVariable Long id,
			@RequestHeader(value = "X-User-Roles", required = false) String roles) {
		requireSystemAdmin(roles);
		return ResponseUtil.ok(airlineService.changeStatusByAdmin(id, AirlineStatus.INACTIVE));
	}

	@PostMapping("/{id}/ban")
	public ResponseEntity<ApiResponse<AirlineResponse>> banAirline(
			@PathVariable Long id,
			@RequestHeader(value = "X-User-Roles", required = false) String roles) {
		requireSystemAdmin(roles);
		return ResponseUtil.ok(airlineService.changeStatusByAdmin(id, AirlineStatus.BANNED));
	}

	private void requireSystemAdmin(String roles) {
		if (roles == null || !roles.contains(UserRole.ROLE_SYSTEM_ADMIN.name())) {
			throw new BaseException(ErrorCode.FORBIDDEN);
		}
	}
}
