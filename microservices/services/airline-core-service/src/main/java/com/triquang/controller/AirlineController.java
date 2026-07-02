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

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/airlines")
@RequiredArgsConstructor
@Tag(name = "Airlines", description = "Manage airline profiles, ownership, approval status, and dropdown reference data.")
public class AirlineController {

	private final AirlineService airlineService;

	// ---------- CREATE ----------
	@PostMapping
	@Operation(summary = "Create an airline", description = "Creates an airline profile for the authenticated airline owner.")
	public ResponseEntity<ApiResponse<AirlineResponse>> createAirline(@Valid @RequestBody AirlineRequest request,
			@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil.created(airlineService.createAirline(request, userId));
	}

	// ---------- MY AIRLINES ----------
	@GetMapping("/admin")
	@Operation(summary = "List owned airlines", description = "Returns airline profiles owned by the authenticated airline owner.")
	public ResponseEntity<ApiResponse<List<AirlineResponse>>> getAirlineByOwner(
			@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {
		return ResponseUtil.ok(airlineService.getAirlinesByOwner(userId));
	}

	// ---------- GET BY ID ----------
	@GetMapping("/reference/{id}")
	@Operation(summary = "Get airline reference by ID", description = "Returns read-only airline reference data for service-to-service and traveler display use cases.")
	public ResponseEntity<ApiResponse<AirlineResponse>> getAirlineReferenceById(@PathVariable Long id) {
		return ResponseUtil.ok(airlineService.getAirlineById(id));
	}

	// ---------- ADMIN GET BY ID ----------
	@GetMapping("/{id}")
	@Operation(summary = "Get an airline by ID", description = "System-admin endpoint. Returns a single airline profile by its identifier.")
	public ResponseEntity<ApiResponse<AirlineResponse>> getAirlineById(
			@PathVariable Long id,
			@Parameter(hidden = true) @RequestHeader(value = "X-User-Roles", required = false) String roles) {
		requireSystemAdmin(roles);
		return ResponseUtil.ok(airlineService.getAirlineById(id));
	}

	// ---------- GET ALL ----------
	@GetMapping
	@Operation(summary = "Search airlines", description = "Returns a paginated airline list with optional keyword and status filters.")
	public ResponseEntity<ApiResponse<Page<AirlineResponse>>> getAllAirlines(
			@Parameter(hidden = true) @RequestHeader(value = "X-User-Roles", required = false) String roles,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size,
			@RequestParam(defaultValue = "name") String sortBy,
			@RequestParam(defaultValue = "asc") String sortDirection,
			@RequestParam(required = false) String keyword,
			@RequestParam(required = false) AirlineStatus status) {

		requireSystemAdmin(roles);

		Sort sort = Sort.by(Sort.Direction.fromString(sortDirection), sortBy);
		Pageable pageable = PageRequest.of(page, size, sort);

		return ResponseUtil.ok(airlineService.searchAdvanced(keyword, status, pageable));
	}

	// ---------- DROPDOWN ----------
	@GetMapping("/dropdown")
	@Operation(summary = "List airline dropdown options", description = "Returns compact airline reference data for selection controls.")
	public ResponseEntity<ApiResponse<List<AirlineDropdownItem>>> getAirlinesForDropdown() {

		return ResponseUtil.ok(airlineService.getAirlinesForDropdown());
	}

	// ---------- UPDATE ----------
	@PutMapping("/{id}")
	@Operation(summary = "Update an airline", description = "Updates an airline profile owned by the authenticated airline owner.")
	public ResponseEntity<ApiResponse<AirlineResponse>> updateAirline(@PathVariable Long id,
			@Valid @RequestBody AirlineRequest request,
			@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil.ok(airlineService.updateAirline(id, request, userId));
	}

	// ---------- DELETE ----------
	@DeleteMapping("/{id}")
	@Operation(summary = "Delete an airline", description = "Deletes an airline profile owned by the authenticated airline owner.")
	public ResponseEntity<ApiResponse<Void>> deleteAirline(@PathVariable Long id,
			@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

		airlineService.deleteAirline(id, userId);

		return ResponseUtil.noContent();
	}

	// ---------- ADMIN ----------
	@PostMapping("/{id}/approve")
	@Operation(summary = "Approve an airline", description = "Activates an airline profile. Requires the system administrator role.")
	public ResponseEntity<ApiResponse<AirlineResponse>> approveAirline(
			@PathVariable Long id,
			@Parameter(hidden = true) @RequestHeader(value = "X-User-Roles", required = false) String roles) {
		requireSystemAdmin(roles);
		return ResponseUtil.ok(airlineService.changeStatusByAdmin(id, AirlineStatus.ACTIVE));
	}

	@PostMapping("/{id}/reject")
	@Operation(summary = "Reject an airline", description = "Deletes a pending airline application. Requires the system administrator role.")
	public ResponseEntity<ApiResponse<String>> rejectAirline(
			@PathVariable Long id,
			@Parameter(hidden = true) @RequestHeader(value = "X-User-Roles", required = false) String roles) {
		requireSystemAdmin(roles);
		airlineService.rejectAirlineByAdmin(id);
		return ResponseUtil.ok("Airline application rejected");
	}

	@PostMapping("/{id}/suspend")
	@Operation(summary = "Suspend an airline", description = "Marks an airline profile as inactive. Requires the system administrator role.")
	public ResponseEntity<ApiResponse<AirlineResponse>> suspendAirline(
			@PathVariable Long id,
			@Parameter(hidden = true) @RequestHeader(value = "X-User-Roles", required = false) String roles) {
		requireSystemAdmin(roles);
		return ResponseUtil.ok(airlineService.changeStatusByAdmin(id, AirlineStatus.INACTIVE));
	}

	@PostMapping("/{id}/ban")
	@Operation(summary = "Ban an airline", description = "Bans an airline profile. Requires the system administrator role.")
	public ResponseEntity<ApiResponse<AirlineResponse>> banAirline(
			@PathVariable Long id,
			@Parameter(hidden = true) @RequestHeader(value = "X-User-Roles", required = false) String roles) {
		requireSystemAdmin(roles);
		return ResponseUtil.ok(airlineService.changeStatusByAdmin(id, AirlineStatus.BANNED));
	}

	private void requireSystemAdmin(String roles) {
		boolean systemAdmin = roles != null && java.util.Arrays.stream(roles.split(","))
				.map(String::trim)
				.anyMatch(UserRole.ROLE_SYSTEM_ADMIN.name()::equals);
		if (!systemAdmin) {
			throw new BaseException(ErrorCode.FORBIDDEN);
		}
	}
}
