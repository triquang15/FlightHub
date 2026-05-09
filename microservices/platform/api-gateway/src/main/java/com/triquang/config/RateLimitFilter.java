package com.triquang.config;

import com.triquang.enums.ErrorCode;
import com.triquang.payload.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.function.*;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class RateLimitFilter implements HandlerFilterFunction<ServerResponse, ServerResponse> {

    // =========================
    // CONFIG
    // =========================
    private static final int LIMIT = 10;      // max request
    private static final long WINDOW = 60;    // seconds

    // =========================
    // IN-MEMORY STORE (DEV ONLY)
    // =========================
    private final Map<String, RequestInfo> store = new ConcurrentHashMap<>();

    @Override
    public ServerResponse filter(ServerRequest request, HandlerFunction<ServerResponse> next) throws Exception {

        String path = request.path();

        // SKIP AUTH (login/signup)
        if (path.startsWith("/api/auth")) {
            return next.handle(request);
        }

        String ip = request.servletRequest().getRemoteAddr();
        String key = "rl:" + ip + ":" + path;

        long now = Instant.now().getEpochSecond();

        RequestInfo info = store.computeIfAbsent(key, k -> new RequestInfo());

        synchronized (info) {

            // reset window
            if (now - info.timestamp > WINDOW) {
                info.count = 0;
                info.timestamp = now;
            }

            info.count++;

            // RATE LIMIT HIT
            if (info.count > LIMIT) {

                log.warn("Rate limit exceeded key={}", key);

                String traceId = MDC.get("traceId");
                if (traceId == null) traceId = "N/A";

                ApiResponse<Void> response = ApiResponse.error(
                        ErrorCode.TOO_MANY_REQUESTS,
                        traceId
                );

                return ServerResponse
                        .status(ErrorCode.TOO_MANY_REQUESTS.getStatus())
                        .header("X-RateLimit-Limit", String.valueOf(LIMIT))
                        .header("X-RateLimit-Remaining", "0")
                        .header("X-RateLimit-Reset", String.valueOf(WINDOW))
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(response);
            }
        }

        // PASS REQUEST
        return next.handle(request);
    }

    // =========================
    // INNER CLASS
    // =========================
    private static class RequestInfo {
        int count = 0;
        long timestamp = Instant.now().getEpochSecond();
    }
}