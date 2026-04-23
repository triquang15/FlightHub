package com.triquang.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.triquang.enums.UserRole;
import com.triquang.model.User;
import com.triquang.repository.UserRepository;

@Component
@RequiredArgsConstructor
public class DataInitializationComponent implements CommandLineRunner {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;

	@Override
	public void run(String... args) {
		initializeAdminUser();
	}

	private void initializeAdminUser() {
		String adminUsername = "flight_hub@gmail.com";
		if (userRepository.findByEmail(adminUsername) == null) {
			User adminUser = new User();

			adminUser.setPassword(passwordEncoder.encode("admin123"));
			adminUser.setFullName("zosh");
			adminUser.setEmail(adminUsername);
			adminUser.setRole(UserRole.ROLE_SYSTEM_ADMIN);

			User admin = userRepository.save(adminUser);
			System.out.println("Admin user created: " + admin.getEmail());
		}
	}
}
