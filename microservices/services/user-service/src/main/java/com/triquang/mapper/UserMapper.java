package com.triquang.mapper;

import java.util.Collection;
import java.util.List;
import java.util.Set;

import com.triquang.dto.UserDTO;
import com.triquang.model.User;

public final class UserMapper {

    private UserMapper() {}

    // ================= SINGLE =================
    public static UserDTO toDTO(User user) {

        if (user == null) return null;

        return UserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(user.getRole())
                .lastLogin(user.getLastLogin())
                .verified(user.isVerified())   // 🔥 boolean primitive
                .active(user.isActive())       // 🔥 boolean primitive
                .createdAt(user.getCreatedAt())
                .build();
    }

    // ================= LIST =================
    public static List<UserDTO> toDTOList(Collection<User> users) {

        if (users == null || users.isEmpty()) {
            return List.of();
        }

        return users.stream()
                .map(UserMapper::toDTO)
                .toList(); // 🔥 Java 16+
    }

    // ================= SET =================
    public static Set<UserDTO> toDTOSet(Collection<User> users) {

        if (users == null || users.isEmpty()) {
            return Set.of();
        }

        return users.stream()
                .map(UserMapper::toDTO)
                .collect(java.util.stream.Collectors.toSet());
    }
}