package com.triquang.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.triquang.model.Session;

@Repository
public interface SessionRepository extends JpaRepository<Session, Long> {

    // ================= GET =================

    List<Session> findByUserId(Long userId);

    Optional<Session> findByUserIdAndDeviceId(Long userId, String deviceId); // 🔥 ADD

    // ================= DELETE =================

    void deleteByDeviceId(String deviceId);

    void deleteByUserId(Long userId);

    void deleteByUserIdAndDeviceId(Long userId, String deviceId);
}