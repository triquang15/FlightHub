package com.triquang.repository;

import java.math.BigDecimal;

public interface BookingAggregateRow {

    Long getGroupId();

    Long getTotalBookings();

    BigDecimal getTotalRevenue();

    BigDecimal getAverageRevenuePerBooking();

    Long getTotalFlights();
}
