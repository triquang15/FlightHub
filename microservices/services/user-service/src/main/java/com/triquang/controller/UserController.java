package com.triquang.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.triquang.dto.UserDTO;
import com.triquang.enums.ErrorCode;
import com.triquang.enums.UserRole;
import com.triquang.exception.BaseException;
import com.triquang.payload.SessionDTO;
import com.triquang.payload.request.AdminCreateUserRequest;
import com.triquang.payload.request.ChangePasswordRequest;
import com.triquang.payload.request.ForgotPasswordRequest;
import com.triquang.payload.request.ResetPasswordRequest;
import com.triquang.payload.request.UpdateProfileRequest;
import com.triquang.payload.request.UpdateUserPreferencesRequest;
import com.triquang.payload.response.ApiResponse;
import com.triquang.payload.response.UserPreferencesResponse;
import com.triquang.service.UserService;
import com.triquang.service.UserPreferencesService;
import com.triquang.utils.ResponseUtil;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "Manage profiles, preferences, password recovery, user sessions, and system-admin user operations.")
public class UserController {

    private final UserService userService;
    private final UserPreferencesService userPreferencesService;

    // ================= GET MY PROFILE =================
    @GetMapping("/profile")
    @Operation(summary = "Get my profile", description = "Returns the authenticated user's profile using the trusted X-User-Id header injected by the gateway.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Profile returned"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Authentication required")
    })
    public ResponseEntity<ApiResponse<UserDTO>> getMyProfile(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

        return ResponseUtil.ok(userService.getUserById(userId));
    }

    // ================= UPDATE PROFILE =================
    @PutMapping("/profile")
    @Operation(summary = "Update my profile", description = "Updates mutable profile fields for the authenticated user.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Profile updated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid profile payload"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Authentication required")
    })
    public ResponseEntity<ApiResponse<UserDTO>> updateProfile(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody UpdateProfileRequest request) {

        return ResponseUtil.ok(userService.updateProfile(userId, request));
    }

    @GetMapping("/preferences")
    @Operation(summary = "Get my preferences", description = "Returns personalization and notification preference settings for the authenticated user.")
    public ResponseEntity<ApiResponse<UserPreferencesResponse>> getPreferences(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

        return ResponseUtil.ok(userPreferencesService.getPreferences(userId));
    }

    @PatchMapping("/preferences")
    @Operation(summary = "Update my preferences", description = "Partially updates personalization and notification preferences for the authenticated user.")
    public ResponseEntity<ApiResponse<UserPreferencesResponse>> updatePreferences(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody UpdateUserPreferencesRequest request) {

        return ResponseUtil.ok(userPreferencesService.updatePreferences(userId, request));
    }

    // ================= GET BY ID =================
    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID", description = "System-admin endpoint. Returns a user profile by ID.")
    public ResponseEntity<ApiResponse<UserDTO>> getUserById(
            @Parameter(hidden = true) @RequestHeader("X-User-Roles") String roles,
            @PathVariable Long id) {

        requireSystemAdmin(roles);
        return ResponseUtil.ok(userService.getUserById(id));
    }

    // ================= GET ALL =================
    @GetMapping
    @Operation(summary = "Search users", description = "Returns a pageable user list with optional keyword and role filters for system administration.")
    public ResponseEntity<ApiResponse<Page<UserDTO>>> getUsers(
            @Parameter(hidden = true) @RequestHeader("X-User-Roles") String roles,
            Pageable pageable,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role) {

        requireSystemAdmin(roles);
        return ResponseUtil.ok(userService.getUsers(pageable, keyword, parseRole(role)));
    }

    @PostMapping
    @Operation(summary = "Create user", description = "System-admin endpoint. Creates customer, airline owner, or system-admin accounts without public role escalation.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "User created"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "System admin role required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Email already exists")
    })
    public ResponseEntity<ApiResponse<UserDTO>> createUser(
            @Parameter(hidden = true) @RequestHeader("X-User-Roles") String roles,
            @Valid @RequestBody AdminCreateUserRequest request) {

        requireSystemAdmin(roles);
        return ResponseUtil.created(userService.createUserByAdmin(request));
    }

    // ================= DELETE USER =================
    @DeleteMapping("/{id:\\d+}")
    @Operation(summary = "Delete user", description = "System-admin endpoint. Deletes a user account after validating ROLE_SYSTEM_ADMIN from gateway roles.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "User deleted"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "System admin role required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<ApiResponse<String>> deleteUser(
            @Parameter(hidden = true) @RequestHeader("X-User-Roles") String roles,
            @PathVariable Long id) {

        requireSystemAdmin(roles);
        userService.deleteUser(id);
        return ResponseUtil.ok("User deleted successfully");
    }

    // ================= CHANGE PASSWORD =================
    @PostMapping("/change-password")
    @Operation(summary = "Change password", description = "Changes the authenticated user's password after validating the current password.")
    public ResponseEntity<ApiResponse<String>> changePassword(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody ChangePasswordRequest request) {

        userService.changePassword(userId, request);
        return ResponseUtil.ok("Password changed successfully");
    }

    // ================= FORGOT PASSWORD =================
    @PostMapping("/forgot-password")
    @Operation(summary = "Request password reset", description = "Starts a password reset flow. The response is intentionally generic to avoid account enumeration.")
    public ResponseEntity<ApiResponse<String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {

        userService.forgotPassword(request.getEmail());
        return ResponseUtil.ok("If email exists, reset link sent");
    }

    // ================= RESET PASSWORD =================
    @PostMapping("/reset-password")
    @Operation(summary = "Reset password", description = "Completes password reset using a valid reset token and a new password.")
    public ResponseEntity<ApiResponse<String>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {

        userService.resetPassword(request);
        return ResponseUtil.ok("Password reset successfully");
    }

    // ================= GET SESSIONS =================
    @GetMapping("/sessions")
    @Operation(summary = "List my sessions", description = "Returns active refresh-token sessions/devices for the authenticated user.")
    public ResponseEntity<ApiResponse<List<SessionDTO>>> getSessions(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

        return ResponseUtil.ok(userService.getUserSessions(userId));
    }

    // ================= LOGOUT DEVICE =================
    @DeleteMapping("/sessions/{deviceId}")
    @Operation(summary = "Logout one device", description = "Revokes one device session owned by the authenticated user.")
    public ResponseEntity<ApiResponse<String>> logoutDevice(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
            @PathVariable String deviceId) {

        userService.logoutDevice(userId, deviceId);
        return ResponseUtil.ok("Device logged out");
    }

    // ================= LOGOUT ALL =================
    @PostMapping("/logout-all")
    @Operation(summary = "Logout all user sessions", description = "Revokes all refresh-token sessions for the authenticated user.")
    public ResponseEntity<ApiResponse<String>> logoutAll(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

        userService.logoutAll(userId);
        return ResponseUtil.ok("All sessions revoked");
    }

    private void requireSystemAdmin(String roles) {
        if (roles == null || !roles.contains(UserRole.ROLE_SYSTEM_ADMIN.name())) {
            throw new BaseException(ErrorCode.FORBIDDEN);
        }
    }

    private UserRole parseRole(String role) {
        if (role == null || role.isBlank()) {
            return null;
        }

        try {
            return UserRole.valueOf(role);
        } catch (IllegalArgumentException e) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }
    }
}
