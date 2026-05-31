package com.triquang.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.triquang.model.RefreshToken;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    // ================= FIND =================
    Optional<RefreshToken> findByTokenHash(String tokenHash);

    // ================= REVOKE ALL =================
    @Modifying
    @Transactional
    @Query("""
        UPDATE RefreshToken t
        SET t.revoked = true
        WHERE t.user.id = :userId
    """)
    void revokeAllByUserId(@Param("userId") Long userId);

    // ================= REVOKE BY DEVICE =================
    @Modifying
    @Transactional
    @Query("""
        UPDATE RefreshToken t
        SET t.revoked = true
        WHERE t.user.id = :userId
          AND t.deviceId = :deviceId
    """)
    void revokeByUserIdAndDeviceId(@Param("userId") Long userId,
                                   @Param("deviceId") String deviceId);

    @Modifying
    @Transactional
    @Query("""
        DELETE FROM RefreshToken t
        WHERE t.user.id = :userId
    """)
    void deleteByUserId(@Param("userId") Long userId);
}
