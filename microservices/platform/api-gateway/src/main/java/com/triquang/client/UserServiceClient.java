package com.triquang.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

@FeignClient(
        contextId = "internalUserServiceClient",
        name = "user-service",
        path = "/api/internal/users"
)
public interface UserServiceClient {

    @GetMapping("/token-version/{userId}")
    Integer getTokenVersion(@PathVariable("userId") Long userId);
}
