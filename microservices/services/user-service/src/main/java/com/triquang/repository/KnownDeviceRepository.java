package com.triquang.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.triquang.model.KnownDevice;

@Repository
public interface KnownDeviceRepository extends JpaRepository<KnownDevice, Long> {

    boolean existsByUserIdAndDeviceId(Long userId, String deviceId);

    Optional<KnownDevice> findByUserIdAndDeviceId(Long userId, String deviceId);
}
