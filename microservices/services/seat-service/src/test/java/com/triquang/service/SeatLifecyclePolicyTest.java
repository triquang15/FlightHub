package com.triquang.service;

import com.triquang.enums.SeatAvailabilityStatus;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class SeatLifecyclePolicyTest {

    @Test
    void availableSeatsCanBeHeldAndConfirmed() {
        assertThat(SeatLifecyclePolicy.canHold(SeatAvailabilityStatus.AVAILABLE, null, Instant.now()))
                .isTrue();
        assertThat(SeatLifecyclePolicy.canConfirm(SeatAvailabilityStatus.AVAILABLE))
                .isTrue();
    }

    @Test
    void activeHoldsCannotBeHeldAgainButExpiredHoldsCan() {
        Instant now = Instant.parse("2026-06-18T10:00:00Z");

        assertThat(SeatLifecyclePolicy.canHold(
                SeatAvailabilityStatus.HELD,
                now.plusSeconds(60),
                now))
                .isFalse();

        assertThat(SeatLifecyclePolicy.canHold(
                SeatAvailabilityStatus.HELD,
                now.minusSeconds(1),
                now))
                .isTrue();
    }

    @Test
    void bookedAndBlockedSeatsCannotBeConfirmedByCheckout() {
        assertThat(SeatLifecyclePolicy.canConfirm(SeatAvailabilityStatus.BOOKED))
                .isFalse();
        assertThat(SeatLifecyclePolicy.canConfirm(SeatAvailabilityStatus.BLOCKED))
                .isFalse();
    }

    @Test
    void bookedSeatsCanBeReleasedForValidatedCancellationButOperationalSeatsCannot() {
        assertThat(SeatLifecyclePolicy.canRelease(SeatAvailabilityStatus.BOOKED)).isTrue();
        assertThat(SeatLifecyclePolicy.canRelease(SeatAvailabilityStatus.OCCUPIED)).isFalse();
        assertThat(SeatLifecyclePolicy.canRelease(SeatAvailabilityStatus.BLOCKED)).isFalse();
    }
}
