package com.triquang.controller;

import com.triquang.dto.UserDTO;
import com.triquang.payload.response.ApiResponse;
import com.triquang.service.UserService;
import com.triquang.utils.ResponseUtil;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

	private final UserService userService;

	// ---------- GET MY PROFILE ----------
	@GetMapping("/me")
	public ResponseEntity<ApiResponse<UserDTO>> getMyProfile(@RequestHeader("X-User-Email") String email) {

		return ResponseUtil.ok(userService.getUserProfile(email));
	}

	// ---------- GET BY ID ----------
	@GetMapping("/{id}")
	public ResponseEntity<ApiResponse<UserDTO>> getUserById(@PathVariable Long id) {

		return ResponseUtil.ok(userService.getUserById(id));
	}

	// ---------- GET ALL ----------
	@GetMapping
	public ResponseEntity<ApiResponse<Page<UserDTO>>> getUsers(Pageable pageable) {

		return ResponseUtil.ok(userService.getUsers(pageable));
	}
}