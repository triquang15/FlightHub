package com.triquang.service.impl;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.triquang.enums.UserRole;
import com.triquang.model.User;
import com.triquang.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializationComponent implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final Environment env;

    @Override
    public void run(String... args) {
        log.info("=== Data Initialization START ===");

        String profile = env.getProperty("spring.profiles.active", "default");

        if ("dev".equals(profile) || "local".equals(profile)) {
            initializeAdminUser();
        } else {
            log.info("Skip admin initialization in profile: {}", profile);
        }

        log.info("=== Data Initialization END ===");
    }

    private void initializeAdminUser() {

        String email = "admin@gmail.com";

        userRepository.findByEmail(email).ifPresentOrElse(
            user -> log.info("Admin already exists: {}", email),
            () -> createAdmin(email)
        );
    }

    private void createAdmin(String email) {

        String rawPassword = env.getProperty("app.admin.password");

        if (rawPassword == null || rawPassword.isBlank()) {
            log.warn("Admin password not set in environment → skip creation");
            return;
        }

        User admin = User.builder()
                .email(email)
                .password(passwordEncoder.encode(rawPassword))
                .fullName("System Admin")
                .phone(null)
                .role(UserRole.ROLE_SYSTEM_ADMIN)

                .verified(true)
                .active(true)
                .tokenVersion(0)
                .build();

        userRepository.save(admin);

        log.info("Admin user created: {}", email);
    }
}