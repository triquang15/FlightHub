package com.triquang.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import com.triquang.dto.UserDTO;
import com.triquang.exception.UserException;
import com.triquang.mapper.UserMapper;
import com.triquang.model.User;
import com.triquang.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class UserController {

	private final UserService userService;

	@GetMapping("/api/users/profile")
	public ResponseEntity<UserDTO> getUserProfile(@RequestHeader("X-User-Email") String email) throws UserException {
		User user = userService.getUserByEmail(email);
		return ResponseEntity.ok(UserMapper.toDTO(user));
	}

	@GetMapping("/api/users/{userId}")
	public ResponseEntity<UserDTO> getUserById(@PathVariable Long userId) throws UserException {
		User user = userService.getUserById(userId);
		return ResponseEntity.ok(UserMapper.toDTO(user));
	}

	@GetMapping("/api/users")
	public ResponseEntity<List<UserDTO>> getUsers() throws UserException {
		List<User> users = userService.getUsers();
		return ResponseEntity.ok(UserMapper.toDTOList(users));
	}
}
