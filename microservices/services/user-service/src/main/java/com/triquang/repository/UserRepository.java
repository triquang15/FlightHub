package com.triquang.repository;

import java.util.Set;

import org.springframework.data.jpa.repository.JpaRepository;

import com.triquang.enums.UserRole;
import com.triquang.model.User;

public interface UserRepository extends JpaRepository<User, Long> {

    User findByEmail(String email);

    Set<User> findByRole(UserRole role);
}
