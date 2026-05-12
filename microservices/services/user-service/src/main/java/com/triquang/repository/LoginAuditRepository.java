package com.triquang.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.triquang.model.LoginAudit;

@Repository
public interface LoginAuditRepository extends JpaRepository<LoginAudit, Long> {

    //  count failed login in time window (anti brute-force)
    long countByEmailAndSuccessFalseAndCreatedAtAfter(
            String email,
            LocalDateTime time
    );

    // optional: get recent logs
    long countByEmailAndCreatedAtAfter(
            String email,
            LocalDateTime time
    );
    
    List<LoginAudit> findTop5ByEmailOrderByCreatedAtDesc(String email);
}