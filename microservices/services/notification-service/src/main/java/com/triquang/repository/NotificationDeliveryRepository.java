package com.triquang.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.triquang.model.NotificationDelivery;

public interface NotificationDeliveryRepository extends JpaRepository<NotificationDelivery, Long> {
    Optional<NotificationDelivery> findByDeliveryKey(String deliveryKey);
}
