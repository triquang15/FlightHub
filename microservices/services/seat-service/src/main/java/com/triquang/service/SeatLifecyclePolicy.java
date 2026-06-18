package com.triquang.service;

import com.triquang.enums.SeatAvailabilityStatus;

import java.time.Instant;

public final class SeatLifecyclePolicy {

    private SeatLifecyclePolicy() {
    }

    public static boolean canHold(SeatAvailabilityStatus status, Instant holdExpiresAt, Instant now) {
        return status == SeatAvailabilityStatus.AVAILABLE
                || (status == SeatAvailabilityStatus.HELD
                && holdExpiresAt != null
                && !holdExpiresAt.isAfter(now));
    }

    public static boolean canRelease(SeatAvailabilityStatus status) {
        return status != SeatAvailabilityStatus.BOOKED;
    }

    public static boolean canConfirm(SeatAvailabilityStatus status) {
        return status == SeatAvailabilityStatus.AVAILABLE
                || status == SeatAvailabilityStatus.HELD;
    }
}
