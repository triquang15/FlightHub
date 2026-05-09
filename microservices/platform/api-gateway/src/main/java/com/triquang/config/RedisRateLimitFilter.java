package com.triquang.config;

import com.triquang.enums.ErrorCode;
import com.triquang.payload.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.function.*;

import java.time.Duration;

@Slf4j
@Component
@RequiredArgsConstructor
public class RedisRateLimitFilter implements HandlerFilterFunction<ServerResponse, ServerResponse> {

    private final StringRedisTemplate redisTemplate;

    private static final int CAPACITY = 20;
    private static final long WINDOW = 60;

    @Override
    public ServerResponse filter(ServerRequest request, HandlerFunction<ServerResponse> next) throws Exception {

        String path = request.path();

        // 1. Skip auth
        if (path.startsWith("/api/auth")) {
            return next.handle(request);
        }

        // 2. Key
        String userId = request.headers().firstHeader("X-User-Id");
        String ip = request.servletRequest().getRemoteAddr();

        String key = "rl:" + (userId != null ? userId : ip) + ":" + path;

        Long current;

        try {
            current = redisTemplate.opsForValue().increment(key);

            if (current != null && current == 1) {
                redisTemplate.expire(key, Duration.ofSeconds(WINDOW));
            }

        } catch (Exception ex) {
            log.error("Redis unavailable, skipping rate limit", ex);
            return next.handle(request);
        }

        // 3. Limit check
        if (current != null && current > CAPACITY) {

            log.warn("Rate limit exceeded key={}", key);

            String traceId = MDC.get(TraceIdFilter.TRACE_ID);
            if (traceId == null) traceId = "N/A";

            ApiResponse<Void> response = ApiResponse.error(
                    ErrorCode.TOO_MANY_REQUESTS,
                    traceId
            );

            return ServerResponse.status(ErrorCode.TOO_MANY_REQUESTS.getStatus())
                    .header("X-RateLimit-Limit", String.valueOf(CAPACITY))
                    .header("X-RateLimit-Remaining", "0")
                    .header("X-RateLimit-Reset", String.valueOf(WINDOW))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
        }

        return next.handle(request);
    }
}