package com.triquang.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.triquang.dto.UserDTO;
import com.triquang.enums.UserRole;
import com.triquang.payload.SessionDTO;
import com.triquang.payload.request.AdminCreateUserRequest;
import com.triquang.payload.request.ChangePasswordRequest;
import com.triquang.payload.request.ResetPasswordRequest;
import com.triquang.payload.request.UpdateProfileRequest;

public interface UserService {

    UserDTO getUserById(Long id);

    Page<UserDTO> getUsers(Pageable pageable, String keyword, UserRole role);

    UserDTO createUserByAdmin(AdminCreateUserRequest request);

    UserDTO updateProfile(Long userId, UpdateProfileRequest request);

    void deleteUser(Long id);

    void changePassword(Long userId, ChangePasswordRequest request);

    void forgotPassword(String email);

    void resetPassword(ResetPasswordRequest request);

    List<SessionDTO> getUserSessions(Long userId);

    void logoutDevice(Long userId, String deviceId);

    void logoutAll(Long userId);
}
