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

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

	private final TicketService ticketService;

	// =========================
	// GET BY TICKET NUMBER
	// =========================
	@GetMapping("/{ticketNumber}")
	public ResponseEntity<?> getTicketByNumber(@PathVariable String ticketNumber) {

		Ticket ticket = ticketService.getTicketByNumber(ticketNumber);

		return ResponseUtil.ok(TicketMapper.toResponse(ticket));
	}

	// =========================
	// GET BY BOOKING
	// =========================
	@GetMapping("/booking/{bookingId}")
	public ResponseEntity<?> getTicketsByBooking(@PathVariable Long bookingId) {

		List<TicketResponse> responses = ticketService.getTicketsByBooking(bookingId).stream()
				.map(TicketMapper::toResponse).collect(Collectors.toList());

		return ResponseUtil.ok(responses);
	}

	// =========================
	// GET BY PASSENGER
	// =========================
	@GetMapping("/passenger/{passengerId}")
	public ResponseEntity<?> getTicketsByPassenger(@PathVariable Long passengerId) {

		List<TicketResponse> responses = ticketService.getTicketsByPassenger(passengerId).stream()
				.map(TicketMapper::toResponse).collect(Collectors.toList());

		return ResponseUtil.ok(responses);
	}

	// =========================
	// CANCEL TICKET
	// =========================
	@PutMapping("/{ticketId}/cancel")
	public ResponseEntity<?> cancelTicket(@PathVariable Long ticketId, @RequestHeader("X-User-Id") Long userId) {

		Ticket ticket = ticketService.cancelTicket(ticketId);

		return ResponseUtil.ok(TicketMapper.toResponse(ticket));
	}

	// =========================
	// MARK AS USED
	// =========================
	@PutMapping("/{ticketId}/use")
	public ResponseEntity<?> markTicketAsUsed(@PathVariable Long ticketId, @RequestHeader("X-User-Id") Long userId) {

		Ticket ticket = ticketService.markTicketAsUsed(ticketId);

		return ResponseUtil.ok(TicketMapper.toResponse(ticket));
	}

	// =========================
	// REFUND
	// =========================
	@PutMapping("/{ticketId}/refund")
	public ResponseEntity<?> refundTicket(@PathVariable Long ticketId, @RequestHeader("X-User-Id") Long userId) {

		Ticket ticket = ticketService.refundTicket(ticketId);

		return ResponseUtil.ok(TicketMapper.toResponse(ticket));
	}
}