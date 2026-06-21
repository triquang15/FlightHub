package com.triquang.event.listener;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.triquang.client.FlightClient;
import com.triquang.client.PricingClient;
import com.triquang.client.SeatClient;
import com.triquang.client.UserClient;
import com.triquang.enums.BookingStatus;
import com.triquang.enums.TicketStatus;
import com.triquang.event.producer.BookingEventProducer;
import com.triquang.message.PaymentCompletedEvent;
import com.triquang.message.PaymentRefundedEvent;
import com.triquang.model.Booking;
import com.triquang.model.Ticket;
import com.triquang.repository.BookingRepository;
import com.triquang.service.TicketService;

@ExtendWith(MockitoExtension.class)
class PaymentEventListenerTest {

    @Mock private BookingRepository bookingRepository;
    @Mock private BookingEventProducer bookingEventProducer;
    @Mock private FlightClient flightClient;
    @Mock private PricingClient pricingClient;
    @Mock private UserClient userClient;
    @Mock private SeatClient seatClient;
    @Mock private TicketService ticketService;

    @InjectMocks private PaymentEventListener listener;

    @Test
    void completedPaymentDoesNotReopenCancelledBooking() {
        Booking booking = Booking.builder()
                .id(20L)
                .bookingReference("BK-CANCELLED")
                .status(BookingStatus.CANCELLED)
                .seatInstanceIds(List.of(101L))
                .build();
        PaymentCompletedEvent event = PaymentCompletedEvent.builder()
                .paymentId(10L)
                .bookingId(20L)
                .build();
        when(bookingRepository.findById(20L)).thenReturn(Optional.of(booking));

        listener.handlePaymentCompleted(event);

        assertEquals(BookingStatus.CANCELLED, booking.getStatus());
        verify(seatClient, never()).confirmSeats(org.mockito.ArgumentMatchers.any());
        verify(ticketService, never()).generateTicketsForBooking(booking);
        verify(bookingRepository, never()).save(booking);
    }

    @Test
    void duplicateCompletedEventDoesNotIssueTicketsAgain() {
        Booking booking = Booking.builder()
                .id(20L)
                .bookingReference("BK-CONFIRMED")
                .status(BookingStatus.CONFIRMED)
                .ticketIssued(true)
                .build();
        PaymentCompletedEvent event = PaymentCompletedEvent.builder()
                .paymentId(10L)
                .bookingId(20L)
                .build();
        when(bookingRepository.findById(20L)).thenReturn(Optional.of(booking));

        listener.handlePaymentCompleted(event);

        verify(ticketService, never()).generateTicketsForBooking(booking);
        verify(bookingRepository, never()).save(booking);
    }

    @Test
    void refundedPaymentCancelsBookingAndRefundsTickets() {
        Ticket ticket = Ticket.builder().status(TicketStatus.BOOKED).build();
        Booking booking = Booking.builder()
                .id(20L)
                .bookingReference("BK-REFUND")
                .status(BookingStatus.CONFIRMED)
                .tickets(new java.util.HashSet<>(java.util.Set.of(ticket)))
                .build();
        PaymentRefundedEvent event = PaymentRefundedEvent.builder()
                .paymentId(10L)
                .bookingId(20L)
                .refundId("re_123")
                .build();
        when(bookingRepository.findById(20L)).thenReturn(Optional.of(booking));

        listener.handlePaymentRefunded(event);

        assertEquals(BookingStatus.CANCELLED, booking.getStatus());
        assertEquals(TicketStatus.REFUNDED, ticket.getStatus());
        verify(bookingRepository).save(booking);
    }
}
