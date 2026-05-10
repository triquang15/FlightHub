package com.triquang.config;

import java.net.URI;
import java.util.UUID;

import org.springframework.cloud.gateway.server.mvc.filter.CircuitBreakerFilterFunctions;
import org.springframework.cloud.gateway.server.mvc.filter.LoadBalancerFilterFunctions;
import org.springframework.cloud.gateway.server.mvc.handler.GatewayRouterFunctions;
import org.springframework.cloud.gateway.server.mvc.handler.HandlerFunctions;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.function.RequestPredicates;
import org.springframework.web.servlet.function.RouterFunction;
import org.springframework.web.servlet.function.RouterFunctions;
import org.springframework.web.servlet.function.ServerRequest;
import org.springframework.web.servlet.function.ServerResponse;

import com.triquang.enums.UserRole;
import com.triquang.service.TokenBlacklistService;

import io.jsonwebtoken.Claims;

@Configuration
public class RouteConfig {

    private final JwtUtil jwtUtil;
    private final TokenBlacklistService blacklistService;
    private final RedisRateLimitFilter redisRateLimitFilter;

    public RouteConfig(
            JwtUtil jwtUtil,
            TokenBlacklistService blacklistService,
            RedisRateLimitFilter redisRateLimitFilter
    ) {
        this.jwtUtil = jwtUtil;
        this.blacklistService = blacklistService;
        this.redisRateLimitFilter = redisRateLimitFilter;
    }

    // ==================== BUILDER ====================

    private RouterFunctions.Builder routeWithCB(
            String routeName,
            String serviceName,
            String cbName,
            String fallbackUri
    ) {
        return GatewayRouterFunctions.route(routeName)
                .filter(LoadBalancerFilterFunctions.lb(serviceName))
                .filter(CircuitBreakerFilterFunctions.circuitBreaker(
                        cbName,
                        URI.create(fallbackUri)
                ));
    }

    private RouterFunctions.Builder routeWithoutCB(
            String routeName,
            String serviceName
    ) {
        return GatewayRouterFunctions.route(routeName)
                .filter(LoadBalancerFilterFunctions.lb(serviceName));
    }

    // ==================== PUBLIC (NO RATE LIMIT) ====================

    @Bean
    public RouterFunction<ServerResponse> authRoutes() {
        return routeWithoutCB("auth-routes", "user-service")
                .route(RequestPredicates.path("/api/auth/**"), HandlerFunctions.http())
                .build();
    }

    // ==================== CORE ====================

    @Bean
    public RouterFunction<ServerResponse> userServiceRoutes() {
        return routeWithoutCB("user-service", "user-service")
                .route(RequestPredicates.path("/api/users/**"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .filter(redisRateLimitFilter) 
                .build();
    }

    @Bean
    @Order(2)
    public RouterFunction<ServerResponse> airlineCoreServiceRoutes() {
        return routeWithoutCB("airline-core", "airline-core-service")
                .route(RequestPredicates.path("/api/airlines/**"), HandlerFunctions.http())
                .route(RequestPredicates.path("/api/aircrafts/**"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .filter(redisRateLimitFilter) 
                .build();
    }

    // ==================== OPTIONAL SERVICES ====================

    @Bean
    public RouterFunction<ServerResponse> locationRoutes() {
        return routeWithCB("location", "location-service", "location-cb", "forward:/fallback/location")
                .route(RequestPredicates.path("/api/airports/**"), HandlerFunctions.http())
                .route(RequestPredicates.path("/api/cities/**"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .filter(redisRateLimitFilter) 
                .build();
    }

    @Bean
    public RouterFunction<ServerResponse> seatRoutes() {
        return routeWithCB("seat", "seat-service", "seat-cb", "forward:/fallback/seat")
                .route(RequestPredicates.path("/api/seats/**"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .filter(redisRateLimitFilter) 
                .build();
    }

    @Bean
    public RouterFunction<ServerResponse> flightRoutes() {
        return routeWithCB("flight", "flight-ops-service", "flight-cb", "forward:/fallback/flight")
                .route(RequestPredicates.path("/api/flights/**"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .filter(redisRateLimitFilter) 
                .build();
    }

    @Bean
    public RouterFunction<ServerResponse> ancillaryRoutes() {
        return routeWithCB("ancillary", "ancillary-service", "ancillary-cb", "forward:/fallback/ancillary")
                .route(RequestPredicates.path("/api/ancillaries/**"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .filter(redisRateLimitFilter) 
                .build();
    }

    @Bean
    public RouterFunction<ServerResponse> paymentRoutes() {
        return routeWithCB("payment", "payment-service", "payment-cb", "forward:/fallback/payment")
                .route(RequestPredicates.path("/api/payments/**"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .filter(redisRateLimitFilter) 
                .build();
    }

    // ==================== ADMIN ====================

    @Bean
    @Order(1)
    public RouterFunction<ServerResponse> adminRoutes() {
        return routeWithoutCB("admin", "location-service")
                .route(RequestPredicates.POST("/api/cities/**"), HandlerFunctions.http())
                .route(RequestPredicates.POST("/api/airports/**"), HandlerFunctions.http())
                .before(this::jwtAuthFilter)
                .filter(redisRateLimitFilter) 
                .before(req -> requireRole(req, UserRole.ROLE_SYSTEM_ADMIN.name()))
                .build();
    }

    // ==================== JWT FILTER ====================

    private ServerRequest jwtAuthFilter(ServerRequest request) {

        String authHeader = request.headers().firstHeader(JwtConstant.JWT_HEADER);

        if (authHeader == null || !authHeader.startsWith(JwtConstant.TOKEN_PREFIX)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing Authorization");
        }

        String token = authHeader.substring(JwtConstant.TOKEN_PREFIX.length());

        // =========================
        // PARSE TOKEN (ONCE)
        // =========================
        Claims claims = jwtUtil.safeExtractClaims(token);

        if (claims == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid token");
        }

        // =========================
        // CHECK BLACKLIST
        // =========================
        if (blacklistService.isBlacklisted(token)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token revoked");
        }

        // =========================
        // CHECK EXPIRED
        // =========================
        if (jwtUtil.isTokenExpired(claims)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token expired");
        }

        // =========================
        // EXTRACT USER INFO
        // =========================
        String email = jwtUtil.extractEmail(claims);
        String roles = jwtUtil.extractAuthorities(claims);
        Long userId = jwtUtil.extractUserId(claims);

        return ServerRequest.from(request)
                .header("X-User-Email", email)
                .header("X-User-Id", String.valueOf(userId))
                .header("X-User-Roles", roles)
                .header("X-Trace-Id", UUID.randomUUID().toString())
                .build();
    }

    private ServerRequest requireRole(ServerRequest request, String role) {
        String roles = request.headers().firstHeader("X-User-Roles");

        if (roles == null || !roles.contains(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        return request;
    }
}