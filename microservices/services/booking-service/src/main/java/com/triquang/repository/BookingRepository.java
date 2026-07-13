package com.triquang.repository;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.triquang.enums.BookingStatus;
import com.triquang.model.Booking;

import java.util.List;
import java.util.Optional;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long>, BookingPerformanceRepository {

    Optional<Booking> findByBookingReference(String bookingReference);

    List<Booking> findByUserId(Long userId);



    long countByFlightInstanceId(Long flightInstanceId);

    long countByAirlineIdAndStatusAndBookingDateGreaterThanEqualAndBookingDateLessThan(
            Long airlineId, BookingStatus status, LocalDateTime from, LocalDateTime to);

    @Query("select coalesce(sum(b.totalAmount), 0.0) from Booking b "
            + "where b.airlineId = :airlineId and b.status = :status "
            + "and b.bookingDate >= :from and b.bookingDate < :to")
    BigDecimal sumRevenueByAirlineAndPeriod(
            @Param("airlineId") Long airlineId,
            @Param("status") BookingStatus status,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    long countByStatus(BookingStatus status);

    long countByStatusAndBookingDateGreaterThanEqualAndBookingDateLessThan(
            BookingStatus status, LocalDateTime from, LocalDateTime to);

    @Query("select coalesce(sum(b.totalAmount), 0.0) from Booking b where b.status = :status")
    BigDecimal sumRevenueByStatus(@Param("status") BookingStatus status);

    @Query("select coalesce(sum(b.totalAmount), 0.0) from Booking b "
            + "where b.status = :status and b.bookingDate >= :from and b.bookingDate < :to")
    BigDecimal sumRevenueByStatusAndPeriod(
            @Param("status") BookingStatus status,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    @Query(value = """
            SELECT TO_CHAR(booking_date, 'YYYY-MM-DD') AS period,
                   COUNT(*) AS bookingCount,
                   COALESCE(SUM(total_amount), 0) AS revenue
            FROM bookings
            WHERE airline_id = :airlineId
              AND status = 'CONFIRMED'
              AND booking_date >= :from
            GROUP BY TO_CHAR(booking_date, 'YYYY-MM-DD')
            ORDER BY period
            """, nativeQuery = true)
    List<BookingPeriodStatistics> findDailyStatistics(
            @Param("airlineId") Long airlineId, @Param("from") LocalDateTime from);

    @Query(value = """
            SELECT TO_CHAR(booking_date, 'YYYY-MM') AS period,
                   COUNT(*) AS bookingCount,
                   COALESCE(SUM(total_amount), 0) AS revenue
            FROM bookings
            WHERE airline_id = :airlineId
              AND status = 'CONFIRMED'
              AND booking_date >= :from
            GROUP BY TO_CHAR(booking_date, 'YYYY-MM')
            ORDER BY period
            """, nativeQuery = true)
    List<BookingPeriodStatistics> findMonthlyStatistics(
            @Param("airlineId") Long airlineId, @Param("from") LocalDateTime from);

    @Query(value = """
            SELECT TO_CHAR(booking_date, 'YYYY-MM-DD') AS period,
                   COUNT(*) AS bookingCount,
                   COALESCE(SUM(total_amount), 0) AS revenue
            FROM bookings
            WHERE status = 'CONFIRMED'
              AND booking_date >= :from
            GROUP BY TO_CHAR(booking_date, 'YYYY-MM-DD')
            ORDER BY period
            """, nativeQuery = true)
    List<BookingPeriodStatistics> findDailyStatisticsForPlatform(@Param("from") LocalDateTime from);

    @Query(value = """
            SELECT TO_CHAR(booking_date, 'YYYY-MM') AS period,
                   COUNT(*) AS bookingCount,
                   COALESCE(SUM(total_amount), 0) AS revenue
            FROM bookings
            WHERE status = 'CONFIRMED'
              AND booking_date >= :from
            GROUP BY TO_CHAR(booking_date, 'YYYY-MM')
            ORDER BY period
            """, nativeQuery = true)
    List<BookingPeriodStatistics> findMonthlyStatisticsForPlatform(@Param("from") LocalDateTime from);

    @Query(value = """
            SELECT airline_id AS groupId,
                   COUNT(*) AS totalBookings,
                   COALESCE(SUM(total_amount), 0) AS totalRevenue,
                   COALESCE(AVG(total_amount), 0) AS averageRevenuePerBooking,
                   COUNT(DISTINCT flight_id) AS totalFlights
            FROM bookings
            WHERE status = 'CONFIRMED'
              AND airline_id IS NOT NULL
            GROUP BY airline_id
            ORDER BY totalBookings DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<BookingAggregateRow> findTopAirlinesByBookings(@Param("limit") int limit);

    @Query(value = """
            SELECT airline_id AS groupId,
                   COUNT(*) AS totalBookings,
                   COALESCE(SUM(total_amount), 0) AS totalRevenue,
                   COALESCE(AVG(total_amount), 0) AS averageRevenuePerBooking,
                   COUNT(DISTINCT flight_id) AS totalFlights
            FROM bookings
            WHERE status = 'CONFIRMED'
              AND airline_id IS NOT NULL
            GROUP BY airline_id
            ORDER BY totalRevenue DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<BookingAggregateRow> findTopAirlinesByRevenue(@Param("limit") int limit);

    @Query(value = """
            SELECT airline_id AS groupId,
                   COUNT(*) AS totalBookings,
                   COALESCE(SUM(total_amount), 0) AS totalRevenue,
                   COALESCE(AVG(total_amount), 0) AS averageRevenuePerBooking,
                   COUNT(DISTINCT flight_id) AS totalFlights
            FROM bookings
            WHERE status = 'CONFIRMED'
              AND airline_id IS NOT NULL
            GROUP BY airline_id
            ORDER BY averageRevenuePerBooking DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<BookingAggregateRow> findTopAirlinesByAverageRevenue(@Param("limit") int limit);

    @Query(value = """
            SELECT airline_id AS groupId,
                   COUNT(*) AS totalBookings,
                   COALESCE(SUM(total_amount), 0) AS totalRevenue,
                   COALESCE(AVG(total_amount), 0) AS averageRevenuePerBooking,
                   COUNT(DISTINCT flight_id) AS totalFlights
            FROM bookings
            WHERE status = 'CONFIRMED'
              AND airline_id IS NOT NULL
            GROUP BY airline_id
            ORDER BY totalFlights DESC, totalBookings DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<BookingAggregateRow> findTopAirlinesByFlightCount(@Param("limit") int limit);

    @Query(value = """
            SELECT flight_id AS groupId,
                   COUNT(*) AS totalBookings,
                   COALESCE(SUM(total_amount), 0) AS totalRevenue,
                   COALESCE(AVG(total_amount), 0) AS averageRevenuePerBooking,
                   COUNT(DISTINCT flight_instance_id) AS totalFlights
            FROM bookings
            WHERE status = 'CONFIRMED'
              AND flight_id IS NOT NULL
            GROUP BY flight_id
            ORDER BY totalBookings DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<BookingAggregateRow> findTopFlightsByBookings(@Param("limit") int limit);

    @Query(value = """
            SELECT flight_id AS groupId,
                   COUNT(*) AS totalBookings,
                   COALESCE(SUM(total_amount), 0) AS totalRevenue,
                   COALESCE(AVG(total_amount), 0) AS averageRevenuePerBooking,
                   COUNT(DISTINCT flight_instance_id) AS totalFlights
            FROM bookings
            WHERE status = 'CONFIRMED'
              AND airline_id = :airlineId
              AND flight_id IS NOT NULL
            GROUP BY flight_id
            ORDER BY totalBookings DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<BookingAggregateRow> findTopFlightsByBookingsForAirline(
            @Param("airlineId") Long airlineId,
            @Param("limit") int limit);

    @Query(value = """
            SELECT flight_id AS groupId,
                   COUNT(*) AS totalBookings,
                   COALESCE(SUM(total_amount), 0) AS totalRevenue,
                   COALESCE(AVG(total_amount), 0) AS averageRevenuePerBooking,
                   COUNT(DISTINCT flight_instance_id) AS totalFlights
            FROM bookings
            WHERE status = 'CONFIRMED'
              AND airline_id = :airlineId
              AND flight_id IS NOT NULL
            GROUP BY flight_id
            ORDER BY totalRevenue DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<BookingAggregateRow> findTopFlightsByRevenueForAirline(
            @Param("airlineId") Long airlineId,
            @Param("limit") int limit);


    @Query("SELECT b FROM Booking b " +
            "LEFT JOIN FETCH b.passengers " +
            "LEFT JOIN FETCH b.legs " +
//            "LEFT JOIN FETCH b.payment " +
            "LEFT JOIN FETCH b.tickets " +
            "WHERE b.id = :id")
    Optional<Booking> findByIdWithDetails(@Param("id") Long id);


    @Query("SELECT DISTINCT b FROM Booking b " +
            "LEFT JOIN FETCH b.passengers p " +
            "WHERE b.airlineId = :airlineId " +
            "AND (:search IS NULL OR " +
            "LOWER(b.bookingReference) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(b.contactInfo.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(b.contactInfo.phone) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "AND (:status IS NULL OR b.status = :status) " +
            "AND (:flightInstanceId IS NULL OR b.flightInstanceId = :flightInstanceId)")
    List<Booking> findByAirlineWithFilters(
            @Param("airlineId") Long airlineId,
            @Param("search") String search,
            @Param("status") BookingStatus status,
            @Param("flightInstanceId") Long flightInstanceId,
            Sort sort);

    @Query("SELECT DISTINCT b FROM Booking b " +
            "LEFT JOIN FETCH b.passengers " +
            "WHERE b.airlineId = :airlineId " +
            "AND (:status IS NULL OR b.status = :status) " +
            "AND (:flightInstanceId IS NULL OR b.flightInstanceId = :flightInstanceId)")
    List<Booking> findByAirlineWithFiltersNoSearch(
            @Param("airlineId") Long airlineId,
            @Param("status") BookingStatus status,
            @Param("flightInstanceId") Long flightInstanceId,
            Sort sort);
}
