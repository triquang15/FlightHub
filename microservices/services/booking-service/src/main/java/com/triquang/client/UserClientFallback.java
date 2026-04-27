package com.triquang.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import com.triquang.dto.UserDTO;

@Component
@Slf4j
public class UserClientFallback implements UserClient {

    @Override
    public UserDTO getUserById(Long userId) {
        log.warn("UserClient fallback triggered for userId={}", userId);
        return null;
    }
}
