package com.triquang.controller;

import lombok.extern.slf4j.Slf4j;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.triquang.model.User;
import com.triquang.repository.UserRepository;

@RestController
@RequestMapping("/api/internal/users")
@Slf4j
public class InternalUserController {

    private static final String INTERNAL_SECRET_HEADER = "X-Internal-Secret";

    private final UserRepository userRepository;
    private final String internalSecret;

    public InternalUserController(
            UserRepository userRepository,
            @Value("${app.internal.secret}") String internalSecret
    ) {
        this.userRepository = userRepository;
        this.internalSecret = internalSecret;
    }

    @GetMapping("/token-version/{userId}")
    public Integer getTokenVersion(
            @PathVariable Long userId,
            @RequestHeader(value = INTERNAL_SECRET_HEADER, required = false) String providedSecret
    ) {

        verifyInternalSecret(providedSecret);

        Integer version = userRepository.findById(userId)
                .map(User::getTokenVersion)
                .orElse(0);

        log.debug("INTERNAL_API getTokenVersion userId={} version={}", userId, version);

        return version;
    }

    private void verifyInternalSecret(String providedSecret) {
        if (providedSecret == null || providedSecret.isBlank()) {
            log.warn("INTERNAL_API denied: missing internal secret header");
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing internal credentials");
        }

        byte[] expected = internalSecret.getBytes(StandardCharsets.UTF_8);
        byte[] actual = providedSecret.getBytes(StandardCharsets.UTF_8);

        if (!MessageDigest.isEqual(expected, actual)) {
            log.warn("INTERNAL_API denied: invalid internal secret");
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid internal credentials");
        }
    }
}
