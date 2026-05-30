package com.triquang.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.triquang.dto.UserDTO;
import com.triquang.payload.SessionDTO;
import com.triquang.payload.request.ChangePasswordRequest;
import com.triquang.payload.request.ForgotPasswordRequest;
import com.triquang.payload.request.ResetPasswordRequest;
import com.triquang.payload.request.UpdateProfileRequest;
import com.triquang.payload.response.ApiResponse;
import com.triquang.service.UserService;
import com.triquang.utils.ResponseUtil;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // ================= GET MY PROFILE =================
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserDTO>> getMyProfile(
            @RequestHeader("X-User-Id") Long userId) {

        return ResponseUtil.ok(userService.getUserById(userId));
    }

    // ================= UPDATE PROFILE =================
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserDTO>> updateProfile(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody UpdateProfileRequest request) {

        return ResponseUtil.ok(userService.updateProfile(userId, request));
    }

    // ================= GET BY ID =================
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDTO>> getUserById(@PathVariable Long id) {

        return ResponseUtil.ok(userService.getUserById(id));
    }

    // ================= GET ALL =================
    @GetMapping
    public ResponseEntity<ApiResponse<Page<UserDTO>>> getUsers(Pageable pageable) {

        return ResponseUtil.ok(userService.getUsers(pageable));
    }

    // ================= CHANGE PASSWORD =================
    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<String>> changePassword(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody ChangePasswordRequest request) {

        userService.changePassword(userId, request);
        return ResponseUtil.ok("Password changed successfully");
    }

    // ================= FORGOT PASSWORD =================
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {

        userService.forgotPassword(request.getEmail());
        return ResponseUtil.ok("If email exists, reset link sent");
    }

    // ================= RESET PASSWORD =================
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {

        userService.resetPassword(request);
        return ResponseUtil.ok("Password reset successfully");
    }

    // ================= GET SESSIONS =================
    @GetMapping("/sessions")
    public ResponseEntity<ApiResponse<List<SessionDTO>>> getSessions(
            @RequestHeader("X-User-Id") Long userId) {

        return ResponseUtil.ok(userService.getUserSessions(userId));
    }

    // ================= LOGOUT DEVICE =================
    @DeleteMapping("/sessions/{deviceId}")
    public ResponseEntity<ApiResponse<String>> logoutDevice(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable String deviceId) {

        userService.logoutDevice(userId, deviceId);
        return ResponseUtil.ok("Device logged out");
    }

    // ================= LOGOUT ALL =================
    @PostMapping("/logout-all")
    public ResponseEntity<ApiResponse<String>> logoutAll(
            @RequestHeader("X-User-Id") Long userId) {

        userService.logoutAll(userId);
        return ResponseUtil.ok("All sessions revoked");
    }
}
