package com.triquang.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.triquang.enums.UserRole;
import com.triquang.model.User;
import com.triquang.repository.UserRepository;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializationComponent implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        log.info("=== Data Initialization START ===");
        initializeAdminUser();
        log.info("=== Data Initialization END ===");
    }

    private void initializeAdminUser() {

        String email = "admin@gmail.com";

        boolean exists = userRepository.findByEmail(email).isPresent();

        if (!exists) {

            User adminUser = new User();
            adminUser.setEmail(email);
            adminUser.setPassword(passwordEncoder.encode("admin123"));
            adminUser.setFullName("Admin System");
            adminUser.setRole(UserRole.ROLE_SYSTEM_ADMIN);
            adminUser.setPhone("0123456789");

            userRepository.save(adminUser);

            log.info("Admin user created: {}", email);

        } else {
            log.info("Admin user already exists: {}", email);
        }
    }
}
