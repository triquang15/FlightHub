package com.triquang.service.impl;

import com.triquang.model.LoginAudit;
import com.triquang.repository.LoginAuditRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final LoginAuditRepository loginAuditRepo;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveLoginAudit(String email, boolean success, String ip, String agent) {

        loginAuditRepo.save(LoginAudit.builder()
                .email(email)
                .success(success)
                .ipAddress(ip)
                .userAgent(agent)
                .build());
    }
}