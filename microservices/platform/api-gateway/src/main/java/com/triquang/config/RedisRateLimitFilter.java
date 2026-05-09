package com.triquang.config;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.function.*;

import java.time.Duration;

@Slf4j
@Component
@RequiredArgsConstructor
public class RedisRateLimitFilter implements HandlerFilterFunction<ServerResponse, ServerResponse> {

    private final StringRedisTemplate redisTemplate;

    private static final int CAPACITY = 20;   // max request
    private static final long WINDOW = 60;    // seconds

    @Override
    public ServerResponse filter(ServerRequest request, HandlerFunction<ServerResponse> next) throws Exception {

        String path = request.path();

        // 🔥 1. SKIP AUTH APIs
        if (path.startsWith("/api/auth")) {
            return next.handle(request);
        }

        // 🔥 2. KEY DESIGN
        String userId = request.headers().firstHeader("X-User-Id");
        String ip = request.servletRequest().getRemoteAddr();

        String key = "rl:" + (userId != null ? userId : ip) + ":" + path;

        Long current;

        try {
            // 3. INCREMENT COUNTER
            current = redisTemplate.opsForValue().increment(key);

            // 4. SET TTL ONLY FIRST TIME
            if (current != null && current == 1) {
                redisTemplate.expire(key, Duration.ofSeconds(WINDOW));
            }

        } catch (Exception ex) {
            // 5. REDIS DOWN → ALLOW REQUEST
            log.error("Redis unavailable, skipping rate limit", ex);
            return next.handle(request);
        }

        // 6. CHECK LIMIT
        if (current != null && current > CAPACITY) {

            log.warn("Rate limit exceeded key={}", key);

            return ServerResponse.status(429)
                    .header("X-RateLimit-Limit", String.valueOf(CAPACITY))
                    .header("X-RateLimit-Remaining", "0")
                    .header("X-RateLimit-Reset", String.valueOf(WINDOW))
                    .body("""
                        {
                          "status": 429,
                          "message": "Too many requests"
                        }
                    """);
        }

        // 7. PASS REQUEST
        return next.handle(request);
    }
}
