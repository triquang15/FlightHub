package com.triquang.service.impl;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.triquang.enums.ErrorCode;
import com.triquang.enums.TicketStatus;
import com.triquang.exception.BaseException;
import com.triquang.model.Booking;
import com.triquang.model.Passenger;
import com.triquang.model.Ticket;
import com.triquang.repository.TicketRepository;
import com.triquang.service.TicketService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TicketServiceImpl implements TicketService {

    private final TicketRepository ticketRepository;

    @Override
    public List<Ticket> generateTicketsForBooking(Booking booking) {
        log.info("Generating tickets for booking: {}", booking.getBookingReference());

        if (booking.getPassengers() == null || booking.getPassengers().isEmpty()) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }

        List<Ticket> tickets = new ArrayList<>();

        for (Passenger passenger : booking.getPassengers()) {

            String ticketNumber = generateUniqueTicketNumber();

            Ticket ticket = Ticket.builder()
                    .ticketNumber(ticketNumber)
                    .status(TicketStatus.BOOKED)
                    .issuedAt(LocalDateTime.now())
                    .booking(booking)
                    .passenger(passenger)
                    .build();

            tickets.add(ticket);
        }

        List<Ticket> savedTickets = ticketRepository.saveAll(tickets);

        log.info("Successfully generated {} tickets for booking {}",
                savedTickets.size(),
                booking.getBookingReference());

        return savedTickets;
    }

    @Override
    @Transactional(readOnly = true)
    public Ticket getTicketByNumber(String ticketNumber) {
        return ticketRepository.findByTicketNumber(ticketNumber)
                .orElseThrow(() -> new BaseException(ErrorCode.TICKET_NOT_FOUND));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Ticket> getTicketsByBooking(Long bookingId) {

        List<Ticket> tickets = ticketRepository.findByBookingIdWithDetails(bookingId);

        if (tickets == null || tickets.isEmpty()) {
            throw new BaseException(ErrorCode.TICKET_NOT_FOUND);
        }

        return tickets;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Ticket> getTicketsByPassenger(Long passengerId) {

        List<Ticket> tickets = ticketRepository.findByPassengerId(passengerId);

        if (tickets == null || tickets.isEmpty()) {
            throw new BaseException(ErrorCode.TICKET_NOT_FOUND);
        }

        return tickets;
    }

    @Override
    public Ticket cancelTicket(Long ticketId) {

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new BaseException(ErrorCode.TICKET_NOT_FOUND));

        if (ticket.getStatus() == TicketStatus.USED) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }

        if (ticket.getStatus() == TicketStatus.REFUNDED) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }

        ticket.setStatus(TicketStatus.CANCELLED);

        Ticket updated = ticketRepository.save(ticket);

        log.info("Ticket {} cancelled successfully", updated.getTicketNumber());
        return updated;
    }

    @Override
    public Ticket markTicketAsUsed(Long ticketId) {

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new BaseException(ErrorCode.TICKET_NOT_FOUND));

        if (ticket.getStatus() == TicketStatus.CANCELLED) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }

        if (ticket.getStatus() == TicketStatus.REFUNDED) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }

        ticket.setStatus(TicketStatus.USED);

        Ticket updated = ticketRepository.save(ticket);

        log.info("Ticket {} marked as used", updated.getTicketNumber());
        return updated;
    }

    @Override
    public Ticket refundTicket(Long ticketId) {

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new BaseException(ErrorCode.TICKET_NOT_FOUND));

        if (ticket.getStatus() == TicketStatus.USED) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }

        ticket.setStatus(TicketStatus.REFUNDED);

        Ticket updated = ticketRepository.save(ticket);

        log.info("Ticket {} refunded successfully", updated.getTicketNumber());
        return updated;
    }

    private String generateUniqueTicketNumber() {
        String ticketNumber;

        do {
            String datePart = LocalDateTime.now()
                    .toLocalDate()
                    .toString()
                    .replace("-", "");

            String randomPart = UUID.randomUUID()
                    .toString()
                    .substring(0, 8)
                    .toUpperCase();

            ticketNumber = "TKT-" + datePart + "-" + randomPart;

        } while (ticketRepository.existsByTicketNumber(ticketNumber));

        return ticketNumber;
    }
}
