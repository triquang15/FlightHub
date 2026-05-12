package com.triquang.controller;

import com.triquang.payload.request.LoginRequest;
import com.triquang.payload.request.RefreshTokenRequest;
import com.triquang.payload.request.SignupRequest;
import com.triquang.payload.response.ApiResponse;
import com.triquang.payload.response.AuthResponse;
import com.triquang.security.CustomUserDetails;
import com.triquang.service.AuthService;
import com.triquang.utils.RequestUtil;
import com.triquang.utils.ResponseUtil;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Validated
public class AuthController {

    private final AuthService authService;

    // ================= SIGNUP =================
    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<AuthResponse>> signup(
            @Valid @RequestBody SignupRequest req,
            @RequestHeader(value = "X-Device-Id", required = true) String deviceId,
            HttpServletRequest request
    ) {

        String ip = RequestUtil.getClientIp(request);
        String agent = RequestUtil.getUserAgent(request);

        req.setDeviceId(deviceId);

        return ResponseUtil.created(
                authService.signup(req, ip, agent)
        );
    }

    // ================= LOGIN =================
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest req,
            @RequestHeader(value = "X-Device-Id") String deviceId,
            HttpServletRequest request
    ) {

        String ip = RequestUtil.getClientIp(request);
        String agent = RequestUtil.getUserAgent(request);

        return ResponseUtil.ok(authService.login(
                req.getEmail(),
                req.getPassword(),
                deviceId,
                ip,
                agent
        ));
    }

    // ================= REFRESH =================
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @Valid @RequestBody RefreshTokenRequest req,
            @RequestHeader(value = "X-Device-Id") String deviceId,
            HttpServletRequest request
    ) {

        String ip = RequestUtil.getClientIp(request);
        String agent = RequestUtil.getUserAgent(request);

        return ResponseUtil.ok(authService.refreshToken(
                req.getRefreshToken(),
                deviceId,
                ip,
                agent
        ));
    }

    // ================= LOGOUT =================
    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            @Valid @RequestBody RefreshTokenRequest req,
            @RequestHeader(value = "X-Device-Id") String deviceId,
            Authentication authentication
    ) {

        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails user)) {
            throw new RuntimeException("Unauthorized");
        }

        authService.revokeRefreshToken(
                req.getRefreshToken(),
                deviceId,
                user.getId()
        );

        return ResponseUtil.ok("Revoked");
    }

    // ================= LOGOUT ALL =================
    @PostMapping("/logout-all")
    public ResponseEntity<?> logoutAll(Authentication authentication) {

        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails user)) {
            throw new RuntimeException("Unauthorized");
        }

        authService.revokeAllRefreshTokens(user.getId());

        return ResponseUtil.ok("All revoked");
    }
}