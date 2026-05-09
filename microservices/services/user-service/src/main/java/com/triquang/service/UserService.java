package com.triquang.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.triquang.dto.UserDTO;
import com.triquang.payload.request.ChangePasswordRequest;
import com.triquang.payload.request.ResetPasswordRequest;

public interface UserService {

    UserDTO getUserProfile(String email);

    UserDTO getUserById(Long id);

    Page<UserDTO> getUsers(Pageable pageable);
    
    void changePassword(String email, ChangePasswordRequest request);

    void forgotPassword(String email);

    void resetPassword(ResetPasswordRequest request);
}