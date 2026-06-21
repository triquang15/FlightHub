package com.triquang.repository;

import java.math.BigDecimal;

public interface BookingPeriodStatistics {
    String getPeriod();
    Long getBookingCount();
    BigDecimal getRevenue();
}
