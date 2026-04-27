package com.triquang.service.impl;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.triquang.client.AirlineClient;
import com.triquang.client.AncillaryClient;
import com.triquang.client.FlightClient;
import com.triquang.client.PaymentClient;
import com.triquang.client.PricingClient;
import com.triquang.client.SeatClient;
import com.triquang.enums.BookingStatus;
import com.triquang.enums.ErrorCode;
import com.triquang.enums.PaymentGateway;
import com.triquang.exception.BaseException;
import com.triquang.mapper.BookingMapper;
import com.triquang.model.Booking;
import com.triquang.model.Passenger;
import com.triquang.payload.PaymentDTO;
import com.triquang.payload.request.BookingRequest;
import com.triquang.payload.request.PassengerRequest;
import com.triquang.payload.request.PaymentInitiateRequest;
import com.triquang.payload.response.AirlineResponse;
import com.triquang.payload.response.BookingResponse;
import com.triquang.payload.response.BookingStatisticsResponse;
import com.triquang.payload.response.FareResponse;
import com.triquang.payload.response.FlightCabinAncillaryResponse;
import com.triquang.payload.response.FlightInstanceResponse;
import com.triquang.payload.response.FlightMealResponse;
import com.triquang.payload.response.FlightResponse;
import com.triquang.payload.response.PaymentInitiateResponse;
import com.triquang.payload.response.SeatInstanceResponse;
import com.triquang.repository.BookingRepository;
import com.triquang.service.BookingService;
import com.triquang.service.PassengerService;
import com.triquang.service.PricingIntegrationService;
import com.triquang.service.TicketService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final PassengerService passengerService;
    private final TicketService ticketService;
    private final PricingIntegrationService pricingIntegrationService;
    private final PricingClient pricingClient;
    private final AncillaryClient ancillaryClient;
    private final PaymentClient paymentClient;
    private final SeatClient seatClient;
    private final FlightClient flightClient;
    private final AirlineClient airlineClient;

    @Override
    @Transactional
    public PaymentInitiateResponse createBooking(BookingRequest request, Long userId) {

        log.info("Creating booking for user: {}", userId);

        String bookingReference = generateBookingReference();

        Set<Passenger> passengers = new HashSet<>();
        for (PassengerRequest passengerRequest : request.getPassengers()) {
            Passenger passenger = passengerService
                    .findOrCreatePassengerEntity(passengerRequest, userId);
            passengers.add(passenger);
        }

        // Flight validate
        FlightResponse flightResponse;
        try {
            flightResponse = flightClient.getFlightById(request.getFlightId());
        } catch (Exception e) {
            throw new BaseException(ErrorCode.FLIGHT_NOT_FOUND);
        }

        Booking booking = BookingMapper.toEntity(
                request, userId, passengers, bookingReference);
        booking.setStatus(BookingStatus.PENDING);
        booking.setAirlineId(flightResponse.getAirline().getId());

        List<Long> seatInstanceIds = request.getPassengers().stream()
                .map(PassengerRequest::getSeatInstanceId)
                .collect(Collectors.toList());
        booking.setSeatInstanceIds(seatInstanceIds);

        booking = bookingRepository.save(booking);

        for (Passenger passenger : passengers) {
            passenger.setBooking(booking);
        }

        ticketService.generateTicketsForBooking(booking);

        int passengerCount = booking.getPassengers().size();

        Double fareTotal;
        Double seatPrice;
        Double ancillaryPrice;
        Double mealPrice;

        try {
            fareTotal = pricingIntegrationService.calculateFareTotal(booking.getFareId()) * passengerCount;
            seatPrice = seatClient.calculateSeatPrice(booking.getSeatInstanceIds());
            ancillaryPrice = ancillaryClient.calculateAncillariesPrice(booking.getAncillaryIds());
            mealPrice = ancillaryClient.calculateMealPrice(booking.getMealIds());
        } catch (Exception e) {
            throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
        }

        Double totalPrice = fareTotal + seatPrice + ancillaryPrice + mealPrice;

        PaymentInitiateRequest paymentRequest = PaymentInitiateRequest.builder()
                .userId(userId)
                .bookingId(booking.getId())
                .amount(totalPrice)
                .gateway(PaymentGateway.STRIPE)
                .description("Booking: " + bookingReference)
                .build();

        PaymentInitiateResponse paymentInit;
        try {
            paymentInit = paymentClient.initiatePayment(paymentRequest, userId);
        } catch (Exception e) {
            throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
        }

        if (paymentInit == null) {
            throw new BaseException(ErrorCode.AIRLINE_SERVICE_UNAVAILABLE);
        }

        return paymentInit;
    }

    @Override
    @Transactional
    public BookingResponse updateBooking(Long id, BookingRequest request) {

        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.BOOKING_NOT_FOUND));

        Set<Passenger> passengers = new HashSet<>();
        for (PassengerRequest passengerRequest : request.getPassengers()) {
            Passenger passenger = passengerService.findOrCreatePassengerEntity(
                    passengerRequest, booking.getUserId());
            passengers.add(passenger);
        }

        BookingMapper.updateEntityFromRequest(request, booking, passengers);
        Booking updated = bookingRepository.save(booking);
        return convertBookingResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public BookingResponse getBookingById(Long id) {
        Booking booking = bookingRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new BaseException(ErrorCode.BOOKING_NOT_FOUND));
        return convertBookingResponse(booking);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsByAirline(
            Long userId,
            String searchQuery,
            BookingStatus status,
            Long flightInstanceId,
            String sortDirection
    ) {

        AirlineResponse airlineResponse;
        try {
            airlineResponse = airlineClient.getAirlineByOwner(userId);
        } catch (Exception e) {
            throw new BaseException(ErrorCode.AIRLINE_NOT_FOUND);
        }

        Long airlineId = airlineResponse.getId();

        Sort.Direction direction = "asc".equalsIgnoreCase(sortDirection)
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;
        Sort sort = Sort.by(direction, "bookingDate");

        List<Booking> bookings = bookingRepository.findByAirlineWithFilters(
                airlineId, searchQuery, status, flightInstanceId, sort);

        return enrichBatch(bookings);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsByUser(Long userId) {
        return bookingRepository.findByUserId(userId).stream()
                .map(this::convertBookingResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public BookingResponse cancelBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.BOOKING_NOT_FOUND));

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setLastModified(LocalDateTime.now());
        Booking updated = bookingRepository.save(booking);

        log.info("Booking cancelled: {}", booking.getBookingReference());
        return convertBookingResponse(updated);
    }

    @Override
    @Transactional
    public void deleteBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.BOOKING_NOT_FOUND));
        bookingRepository.delete(booking);
        log.info("Booking deleted: {}", booking.getBookingReference());
    }

    @Override
    public boolean existsById(Long id) {
        return bookingRepository.existsById(id);
    }

    @Override
    public long count() {
        return bookingRepository.count();
    }

    @Override
    public long countByFlightId(Long flightId) {
        if (flightId == null) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }
        return bookingRepository.countByFlightInstanceId(flightId);
    }

    @Override
    @Transactional(readOnly = true)
    public BookingStatisticsResponse getBookingStatisticsForAirline(Long airlineId) {

        if (airlineId == null) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }

        Long todayBookings = bookingRepository.count();
        Double todayRevenue = 0.0;
        Long monthBookings = bookingRepository.count();
        Double monthRevenue = 0.0;

        return BookingStatisticsResponse.builder()
                .totalBookingsToday(todayBookings)
                .revenueToday(todayRevenue)
                .totalBookingsThisMonth(monthBookings)
                .revenueThisMonth(monthRevenue)
                .dailyTrend(new ArrayList<>())
                .monthlyData(new ArrayList<>())
                .build();
    }

    private String generateBookingReference() {
        String reference;
        do {
            reference = "BK" + UUID.randomUUID().toString()
                    .substring(0, 8).toUpperCase();
        } while (bookingRepository.findByBookingReference(reference).isPresent());
        return reference;
    }

    private BookingResponse convertBookingResponse(Booking booking) {

        try {
            List<FlightCabinAncillaryResponse> ancillaryResponses =
                    ancillaryClient.getAllByIds(booking.getAncillaryIds());

            List<FlightMealResponse> mealResponses =
                    ancillaryClient.getMealsByIds(booking.getMealIds());

            PaymentDTO paymentDTO =
                    paymentClient.getPaymentByBookingId(booking.getId());

            FareResponse fareResponse =
                    pricingClient.getFareById(booking.getFareId());

            FlightResponse flightResponse =
                    flightClient.getFlightById(booking.getFlightId());

            List<SeatInstanceResponse> seatInstanceResponses =
                    seatClient.getAllByIds(booking.getSeatInstanceIds());

            FlightInstanceResponse flightInstanceResponse =
                    flightClient.getFlightInstanceResponse(booking.getFlightInstanceId());

            return BookingMapper.toResponse(
                    booking,
                    paymentDTO,
                    fareResponse,
                    flightResponse,
                    flightInstanceResponse,
                    ancillaryResponses,
                    mealResponses,
                    seatInstanceResponses
            );

        } catch (Exception e) {
            throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
        }
    }
    
    private List<BookingResponse> enrichBatch(List<Booking> bookings) {
        if (bookings.isEmpty()) return Collections.emptyList();

        List<Long> bookingIds = bookings.stream().map(Booking::getId).collect(Collectors.toList());

        List<Long> fareIds = bookings.stream().map(Booking::getFareId)
                .filter(Objects::nonNull).distinct().collect(Collectors.toList());
        List<Long> flightIds = bookings.stream().map(Booking::getFlightId)
                .filter(Objects::nonNull).distinct().collect(Collectors.toList());
        List<Long> flightInstanceIds = bookings.stream().map(Booking::getFlightInstanceId)
                .filter(Objects::nonNull).distinct().collect(Collectors.toList());
        List<Long> allSeatIds = bookings.stream()
                .flatMap(b -> b.getSeatInstanceIds() != null ? b.getSeatInstanceIds().stream() : Stream.empty())
                .distinct().collect(Collectors.toList());
        List<Long> allAncillaryIds = bookings.stream()
                .flatMap(b -> b.getAncillaryIds() != null ? b.getAncillaryIds().stream() : Stream.empty())
                .distinct().collect(Collectors.toList());
        List<Long> allMealIds = bookings.stream()
                .flatMap(b -> b.getMealIds() != null ? b.getMealIds().stream() : Stream.empty())
                .distinct().collect(Collectors.toList());

        // One call per service
        Map<Long, FareResponse> fareMap = pricingClient.getFaresByIds(fareIds);
        Map<Long, FlightResponse> flightMap = flightClient.getFlightsByIds(flightIds);
        Map<Long, FlightInstanceResponse> flightInstanceMap = flightClient.getFlightInstancesByIds(flightInstanceIds);
        Map<Long, PaymentDTO> paymentMap = paymentClient.getPaymentsByBookingIds(bookingIds);

        Map<Long, SeatInstanceResponse> seatMap = allSeatIds.isEmpty()
                ? Collections.emptyMap()
                : seatClient.getAllByIds(allSeatIds).stream()
                        .collect(Collectors.toMap(SeatInstanceResponse::getId, s -> s));
        Map<Long, FlightCabinAncillaryResponse> ancillaryMap = allAncillaryIds.isEmpty()
                ? Collections.emptyMap()
                : ancillaryClient.getAllByIds(allAncillaryIds).stream()
                        .collect(Collectors.toMap(FlightCabinAncillaryResponse::getId, a -> a));
        Map<Long, FlightMealResponse> mealMap = allMealIds.isEmpty()
                ? Collections.emptyMap()
                : ancillaryClient.getMealsByIds(allMealIds).stream()
                        .collect(Collectors.toMap(FlightMealResponse::getId, m -> m));

        return bookings.stream().map(booking -> {
            List<SeatInstanceResponse> seats = booking.getSeatInstanceIds() != null
                    ? booking.getSeatInstanceIds().stream()
                            .map(seatMap::get).filter(Objects::nonNull).collect(Collectors.toList())
                    : Collections.emptyList();
            List<FlightCabinAncillaryResponse> ancillaries = booking.getAncillaryIds() != null
                    ? booking.getAncillaryIds().stream()
                            .map(ancillaryMap::get).filter(Objects::nonNull).collect(Collectors.toList())
                    : Collections.emptyList();
            List<FlightMealResponse> meals = booking.getMealIds() != null
                    ? booking.getMealIds().stream()
                            .map(mealMap::get).filter(Objects::nonNull).collect(Collectors.toList())
                    : Collections.emptyList();

            return BookingMapper.toResponse(
                    booking,
                    paymentMap.get(booking.getId()),
                    fareMap.get(booking.getFareId()),
                    flightMap.get(booking.getFlightId()),
                    flightInstanceMap.get(booking.getFlightInstanceId()),
                    ancillaries,
                    meals,
                    seats
            );
        }).collect(Collectors.toList());
    }
}
