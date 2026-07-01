package com.triquang.config;

import com.triquang.enums.ErrorCode;
import com.triquang.payload.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.servlet.function.*;

import java.time.Duration;

@Slf4j
@Component
public class RedisRateLimitFilter implements HandlerFilterFunction<ServerResponse, ServerResponse> {

    private final StringRedisTemplate redisTemplate;
    private final int capacity;
    private final long windowSeconds;
    private final int authCapacity;
    private final long authWindowSeconds;
    private final boolean failOpen;

    public RedisRateLimitFilter(
            StringRedisTemplate redisTemplate,
            @Value("${app.rate-limit.capacity:60}") int capacity,
            @Value("${app.rate-limit.window-seconds:60}") long windowSeconds,
            @Value("${app.rate-limit.auth-capacity:10}") int authCapacity,
            @Value("${app.rate-limit.auth-window-seconds:60}") long authWindowSeconds,
            @Value("${app.rate-limit.fail-open:false}") boolean failOpen
    ) {
        this.redisTemplate = redisTemplate;
        this.capacity = capacity;
        this.windowSeconds = windowSeconds;
        this.authCapacity = authCapacity;
        this.authWindowSeconds = authWindowSeconds;
        this.failOpen = failOpen;
    }

    @Override
    public ServerResponse filter(ServerRequest request, HandlerFunction<ServerResponse> next) throws Exception {

        String path = request.path();

        // 1. Key
        String userId = request.headers().firstHeader("X-User-Id");
        String ip = request.servletRequest().getRemoteAddr();

        String key = "rl:" + (userId != null ? userId : ip) + ":" + normalizePath(path);
        int routeCapacity = isAuthSensitivePath(path) ? authCapacity : capacity;
        long routeWindowSeconds = isAuthSensitivePath(path) ? authWindowSeconds : windowSeconds;

        Long current;

        try {
            current = redisTemplate.opsForValue().increment(key);

            if (current != null && current == 1) {
                redisTemplate.expire(key, Duration.ofSeconds(routeWindowSeconds));
            }

        } catch (Exception ex) {
            log.error("Redis unavailable while enforcing rate limit", ex);
            if (failOpen) {
                return next.handle(request);
            }
            return ServerResponse.status(503)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(ApiResponse.error(ErrorCode.SERVICE_UNAVAILABLE, traceId()));
        }

        // 3. Limit check
        if (current != null && current > routeCapacity) {

            log.warn("Rate limit exceeded key={}", key);

            ApiResponse<Void> response = ApiResponse.error(
                    ErrorCode.TOO_MANY_REQUESTS,
                    traceId()
            );

            return ServerResponse.status(ErrorCode.TOO_MANY_REQUESTS.getStatus())
                    .header("X-RateLimit-Limit", String.valueOf(routeCapacity))
                    .header("X-RateLimit-Remaining", "0")
                    .header("X-RateLimit-Reset", String.valueOf(routeWindowSeconds))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
        }

        return next.handle(request);
    }

    private String normalizePath(String path) {
        return path.replaceAll("/[0-9]+(?=/|$)", "/{id}")
                .replaceAll("/[0-9a-fA-F-]{36}(?=/|$)", "/{id}");
    }

    private boolean isAuthSensitivePath(String path) {
        return path.equals("/api/auth/login")
                || path.equals("/api/auth/signup")
                || path.equals("/api/auth/refresh")
                || path.equals("/api/users/forgot-password")
                || path.equals("/api/users/reset-password");
    }

    private String traceId() {
        String traceId = MDC.get(TraceIdFilter.TRACE_ID);
        return traceId != null ? traceId : "N/A";
    }
}
