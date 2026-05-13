package com.triquang.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import com.triquang.model.User;
import com.triquang.repository.UserRepository;

@RestController
@RequestMapping("/api/internal/users")
@Slf4j
public class InternalUserController {

    private final UserRepository userRepository;

    public InternalUserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/token-version/{userId}")
    public Integer getTokenVersion(@PathVariable Long userId) {

        Integer version = userRepository.findById(userId)
                .map(User::getTokenVersion)
                .orElse(0);

        log.debug("INTERNAL_API getTokenVersion userId={} version={}", userId, version);

        return version;
    }
}