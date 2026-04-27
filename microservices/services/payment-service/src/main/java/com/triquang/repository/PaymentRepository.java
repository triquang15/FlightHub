package com.triquang.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.triquang.enums.PaymentStatus;
import com.triquang.model.Payment;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

	Optional<Payment> findByBookingId(Long bookingId);

	Optional<Payment> findByTransactionId(String transactionId);

	List<Payment> findByStatus(PaymentStatus status);

	List<Payment> findByBookingIdIn(Collection<Long> bookingIds);
}
