package com.triquang.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.triquang.mapper.TicketMapper;
import com.triquang.model.Ticket;
import com.triquang.payload.response.TicketResponse;
import com.triquang.service.TicketService;
import com.triquang.utils.ResponseUtil;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/tickets")
@Tag(name = "Tickets", description = "Manage ticket retrieval, cancellation, usage, and refund flows.")
@RequiredArgsConstructor
public class TicketController {

	private final TicketService ticketService;

	// =========================
	// GET BY TICKET NUMBER
	// =========================
	@Operation(summary = "Get ticket by number", description = "Returns a ticket by its ticket number.")
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "Ticket returned"),
		@ApiResponse(responseCode = "404", description = "Ticket not found")
	})
	@GetMapping("/{ticketNumber}")
	public ResponseEntity<?> getTicketByNumber(@PathVariable String ticketNumber) {

		Ticket ticket = ticketService.getTicketByNumber(ticketNumber);

		return ResponseUtil.ok(TicketMapper.toResponse(ticket));
	}

	// =========================
	// GET BY BOOKING
	// =========================
	@Operation(summary = "Get tickets by booking", description = "Returns all tickets associated with a specific booking.")
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "Tickets returned"),
		@ApiResponse(responseCode = "404", description = "Booking not found")
	})
	@GetMapping("/booking/{bookingId}")
	public ResponseEntity<?> getTicketsByBooking(@PathVariable Long bookingId) {

		List<TicketResponse> responses = ticketService.getTicketsByBooking(bookingId).stream()
				.map(TicketMapper::toResponse).collect(Collectors.toList());

		return ResponseUtil.ok(responses);
	}

	// =========================
	// GET BY PASSENGER
	// =========================
	@Operation(summary = "Get tickets by passenger", description = "Returns all tickets for a specific passenger.")
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "Tickets returned"),
		@ApiResponse(responseCode = "404", description = "Passenger not found")
	})
	@GetMapping("/passenger/{passengerId}")
	public ResponseEntity<?> getTicketsByPassenger(@PathVariable Long passengerId) {

		List<TicketResponse> responses = ticketService.getTicketsByPassenger(passengerId).stream()
				.map(TicketMapper::toResponse).collect(Collectors.toList());

		return ResponseUtil.ok(responses);
	}

	// =========================
	// CANCEL TICKET
	// =========================
	@Operation(summary = "Cancel ticket", description = "Cancels a ticket and updates inventory or refund eligibility.")
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "Ticket canceled successfully"),
		@ApiResponse(responseCode = "404", description = "Ticket not found")
	})
	@PutMapping("/{ticketId}/cancel")
	public ResponseEntity<?> cancelTicket(@PathVariable Long ticketId, @Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

		Ticket ticket = ticketService.cancelTicket(ticketId);

		return ResponseUtil.ok(TicketMapper.toResponse(ticket));
	}

	// =========================
	// MARK AS USED
	// =========================
	@Operation(summary = "Mark ticket as used", description = "Marks a ticket as used after boarding.")
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "Ticket marked as used"),
		@ApiResponse(responseCode = "404", description = "Ticket not found")
	})
	@PutMapping("/{ticketId}/use")
	public ResponseEntity<?> markTicketAsUsed(@PathVariable Long ticketId, @Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

		Ticket ticket = ticketService.markTicketAsUsed(ticketId);

		return ResponseUtil.ok(TicketMapper.toResponse(ticket));
	}

	// =========================
	// REFUND
	// =========================
	@Operation(summary = "Refund ticket", description = "Processes a refund for the specified ticket.")
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "Ticket refunded successfully"),
		@ApiResponse(responseCode = "404", description = "Ticket not found")
	})
	@PutMapping("/{ticketId}/refund")
	public ResponseEntity<?> refundTicket(@PathVariable Long ticketId, @Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

		Ticket ticket = ticketService.refundTicket(ticketId);

		return ResponseUtil.ok(TicketMapper.toResponse(ticket));
	}
}