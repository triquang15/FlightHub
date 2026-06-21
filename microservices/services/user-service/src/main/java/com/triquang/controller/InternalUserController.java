package com.triquang.controller;

import lombok.extern.slf4j.Slf4j;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.triquang.dto.UserDTO;
import com.triquang.model.User;
import com.triquang.payload.response.ApiResponse;
import com.triquang.repository.UserRepository;
import com.triquang.service.UserService;
import com.triquang.utils.ResponseUtil;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/internal/users")
@Slf4j
@Tag(name = "Internal Users", description = "Internal service-to-service user endpoints protected by X-Internal-Secret.")
public class InternalUserController {

    private static final String INTERNAL_SECRET_HEADER = "X-Internal-Secret";

    private final UserRepository userRepository;
    private final UserService userService;
    private final String internalSecret;

    public InternalUserController(
            UserRepository userRepository,
            UserService userService,
            @Value("${app.internal.secret}") String internalSecret
    ) {
        this.userRepository = userRepository;
        this.userService = userService;
        this.internalSecret = internalSecret;
    }

    @GetMapping("/{userId}")
    @Operation(summary = "Get user detail", description = "Internal service-to-service endpoint for trusted services that need immutable user profile data for downstream workflows.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "User returned"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Missing internal secret"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Invalid internal secret"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<ApiResponse<UserDTO>> getUserById(
            @PathVariable Long userId,
            @Parameter(description = "Shared internal secret configured between trusted services.")
            @RequestHeader(value = INTERNAL_SECRET_HEADER, required = false) String providedSecret
    ) {

        verifyInternalSecret(providedSecret);

        log.debug("INTERNAL_API getUserById userId={}", userId);
        return ResponseUtil.ok(userService.getUserById(userId));
    }

    @GetMapping("/token-version/{userId}")
    @Operation(summary = "Get token version", description = "Internal endpoint used by gateway/auth infrastructure to validate token revocation version. Do not call from browser clients.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Token version returned"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Missing internal secret"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Invalid internal secret")
    })
    public Integer getTokenVersion(
            @PathVariable Long userId,
            @Parameter(description = "Shared internal secret configured between trusted services.")
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
