package com.triquang.dto;

import java.time.LocalDateTime;

import com.triquang.enums.UserRole;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class UserDTO {
	private Long id;
	private String email;
	private String password;
	private String phone;
	private String fullName;
	private UserRole role;
	private String username;
	private LocalDateTime lastLogin;

	public UserDTO(Long id, String email, String fullName, UserRole role, LocalDateTime lastLogin) {
		this.id = id;
		this.email = email;
		this.fullName = fullName;
		this.role = role;
		this.password = null;
		this.phone = null;
		this.username = null;
		this.lastLogin = lastLogin;
	}
}
