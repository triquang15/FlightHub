package com.triquang.controller;

import com.triquang.payload.request.AppleLoginRequest;
import com.triquang.payload.request.FacebookLoginRequest;
import com.triquang.payload.request.GoogleLoginRequest;
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

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Validated
@Tag(name = "Authentication", description = "User signup, login, refresh token rotation, and logout session controls.")
public class AuthController {

    private final AuthService authService;

    // ================= SIGNUP =================
    @PostMapping("/signup")
    @Operation(summary = "Create customer account and session", description = "Registers a public customer account, records device metadata, and returns access/refresh tokens.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Account created"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid signup payload"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Email or phone already exists")
    })
    public ResponseEntity<ApiResponse<AuthResponse>> signup(
            @Valid @RequestBody SignupRequest req,
            @Parameter(description = "Stable client device identifier used for refresh-token binding.")
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
    @Operation(summary = "Login", description = "Authenticates credentials for one device and issues a new token pair.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Login successful"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid login payload"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Invalid credentials or disabled account")
    })
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest req,
            @Parameter(description = "Stable client device identifier used for refresh-token binding.")
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

    // ================= GOOGLE LOGIN =================
    @PostMapping("/google")
    @Operation(summary = "Login with Google", description = "Verifies a Google Identity Services ID token, creates a customer account when needed, and issues a FlightHub token pair.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Google login successful"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid Google login payload"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Invalid Google token")
    })
    public ResponseEntity<ApiResponse<AuthResponse>> googleLogin(
            @Valid @RequestBody GoogleLoginRequest req,
            @Parameter(description = "Stable client device identifier used for refresh-token binding.")
            @RequestHeader(value = "X-Device-Id") String deviceId,
            HttpServletRequest request
    ) {

        String ip = RequestUtil.getClientIp(request);
        String agent = RequestUtil.getUserAgent(request);

        return ResponseUtil.ok(authService.loginWithGoogle(
                req.getIdToken(),
                deviceId,
                ip,
                agent
        ));
    }

    // ================= FACEBOOK LOGIN =================
    @PostMapping("/facebook")
    @Operation(summary = "Login with Facebook", description = "Verifies a Facebook Login access token, links it to an existing account when possible, creates a customer account when needed, and issues a FlightHub token pair.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Facebook login successful"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid Facebook login payload"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Invalid Facebook token")
    })
    public ResponseEntity<ApiResponse<AuthResponse>> facebookLogin(
            @Valid @RequestBody FacebookLoginRequest req,
            @Parameter(description = "Stable client device identifier used for refresh-token binding.")
            @RequestHeader(value = "X-Device-Id") String deviceId,
            HttpServletRequest request
    ) {

        String ip = RequestUtil.getClientIp(request);
        String agent = RequestUtil.getUserAgent(request);

        return ResponseUtil.ok(authService.loginWithFacebook(
                req.getAccessToken(),
                deviceId,
                ip,
                agent
        ));
    }

    // ================= APPLE LOGIN =================
    @PostMapping("/apple")
    @Operation(summary = "Login with Apple", description = "Verifies an Apple Sign In ID token, links it to an existing account when possible, creates a customer account when needed, and issues a FlightHub token pair.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Apple login successful"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid Apple login payload"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Invalid Apple token")
    })
    public ResponseEntity<ApiResponse<AuthResponse>> appleLogin(
            @Valid @RequestBody AppleLoginRequest req,
            @Parameter(description = "Stable client device identifier used for refresh-token binding.")
            @RequestHeader(value = "X-Device-Id") String deviceId,
            HttpServletRequest request
    ) {

        String ip = RequestUtil.getClientIp(request);
        String agent = RequestUtil.getUserAgent(request);

        return ResponseUtil.ok(authService.loginWithApple(
                req.getIdToken(),
                req.getFullName(),
                deviceId,
                ip,
                agent
        ));
    }

    // ================= REFRESH =================
    @PostMapping("/refresh")
    @Operation(summary = "Refresh token pair", description = "Rotates a refresh token for the same device and returns a new access/refresh token pair.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Token pair refreshed"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid refresh payload"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Refresh token expired, revoked, or bound to another device")
    })
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @Valid @RequestBody RefreshTokenRequest req,
            @Parameter(description = "Stable client device identifier that must match the refresh-token session.")
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
    @Operation(summary = "Logout current device", description = "Revokes one refresh token for the authenticated user and device.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Refresh token revoked"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Authentication required")
    })
    public ResponseEntity<?> logout(
            @Valid @RequestBody RefreshTokenRequest req,
            @Parameter(description = "Device identifier bound to the refresh token.")
            @RequestHeader(value = "X-Device-Id") String deviceId,
            Authentication authentication
    ) {

        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails user)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
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
    @Operation(summary = "Logout all devices", description = "Revokes all refresh tokens for the authenticated user.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "All sessions revoked"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Authentication required")
    })
    public ResponseEntity<?> logoutAll(Authentication authentication) {

        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails user)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        authService.revokeAllRefreshTokens(user.getId());

        return ResponseUtil.ok("All revoked");
    }
}
