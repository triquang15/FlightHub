package com.triquang.service;

import java.util.List;

import com.triquang.model.Booking;
import com.triquang.model.Ticket;

public interface TicketService {

	List<Ticket> generateTicketsForBooking(Booking booking);

	Ticket getTicketByNumber(String ticketNumber);

	List<Ticket> getTicketsByBooking(Long bookingId);

	List<Ticket> getTicketsByPassenger(Long passengerId);

	Ticket cancelTicket(Long ticketId);

	Ticket markTicketAsUsed(Long ticketId);

	Ticket refundTicket(Long ticketId);
}
