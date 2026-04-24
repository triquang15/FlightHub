package com.triquang.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.triquang.dto.UserDTO;

public interface UserService {

    UserDTO getUserProfile(String email);

    UserDTO getUserById(Long id);

    Page<UserDTO> getUsers(Pageable pageable);
}