package com.triquang.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.triquang.model.NotificationEvent;

public interface NotificationEventRepository extends JpaRepository<NotificationEvent, Long> {
    Optional<NotificationEvent> findByEventKey(String eventKey);
}
