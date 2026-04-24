package com.triquang.controller;

import com.triquang.dto.UserDTO;
import com.triquang.service.UserService;
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

    // GET current user 
    @GetMapping("/me")
    public ResponseEntity<UserDTO> getMyProfile(
            @RequestHeader("X-User-Email") String email) {

        return ResponseEntity.ok(userService.getUserProfile(email));
    }

    // GET by ID
    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    // GET all (pagination)
    @GetMapping
    public ResponseEntity<Page<UserDTO>> getUsers(Pageable pageable) {
        return ResponseEntity.ok(userService.getUsers(pageable));
    }
}