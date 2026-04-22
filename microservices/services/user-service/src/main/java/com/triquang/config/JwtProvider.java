// =======================================================
// package: com.triquang.config.JwtProvider
// =======================================================
package com.triquang.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class JwtProvider {

    private final JwtProperties jwtProperties;

    // ===================================================
    // TOKEN GENERATION
    // ===================================================

    public String generateAccessToken(Authentication authentication, Long userId) {

        Date now = new Date();
        Date expiry = new Date(
                now.getTime() + jwtProperties.getAccessTokenExpiration()
        );

        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(authentication.getName()) // email / username
                .issuer(jwtProperties.getIssuer())
                .issuedAt(now)
                .expiration(expiry)
                .claim(JwtConstant.CLAIM_USER_ID, userId)
                .claim(JwtConstant.CLAIM_ROLES,
                        extractRoles(authentication.getAuthorities()))
                .claim(JwtConstant.CLAIM_TOKEN_TYPE,
                        JwtConstant.ACCESS_TOKEN)
                .signWith(getSigningKey())
                .compact();
    }

    public String generateRefreshToken(Authentication authentication, Long userId) {

        Date now = new Date();
        Date expiry = new Date(
                now.getTime() + jwtProperties.getRefreshTokenExpiration()
        );

        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(authentication.getName())
                .issuer(jwtProperties.getIssuer())
                .issuedAt(now)
                .expiration(expiry)
                .claim(JwtConstant.CLAIM_USER_ID, userId)
                .claim(JwtConstant.CLAIM_TOKEN_TYPE,
                        JwtConstant.REFRESH_TOKEN)
                .signWith(getSigningKey())
                .compact();
    }

    // ===================================================
    // TOKEN VALIDATION
    // ===================================================

    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }

    // ===================================================
    // CLAIM EXTRACTION
    // ===================================================

    public String getUsername(String token) {
        return parseClaims(token).getSubject();
    }

    public Long getUserId(String token) {
        Object value = parseClaims(token)
                .get(JwtConstant.CLAIM_USER_ID);

        if (value instanceof Integer i) {
            return i.longValue();
        }

        if (value instanceof Long l) {
            return l;
        }

        return Long.parseLong(String.valueOf(value));
    }

    public String getTokenType(String token) {
        return parseClaims(token)
                .get(JwtConstant.CLAIM_TOKEN_TYPE, String.class);
    }

    public List<String> getRoles(String token) {

        Object roles = parseClaims(token)
                .get(JwtConstant.CLAIM_ROLES);

        if (roles instanceof List<?> list) {
            return list.stream()
                    .map(String::valueOf)
                    .toList();
        }

        return List.of();
    }

    public Date getExpiration(String token) {
        return parseClaims(token).getExpiration();
    }

    // ===================================================
    // TOKEN HELPERS
    // ===================================================

    public String resolveToken(String bearerToken) {

        if (bearerToken == null || bearerToken.isBlank()) {
            return null;
        }

        if (bearerToken.startsWith(JwtConstant.TOKEN_PREFIX)) {
            return bearerToken.substring(
                    JwtConstant.TOKEN_PREFIX.length()
            );
        }

        return bearerToken;
    }

    public boolean isRefreshToken(String token) {
        return JwtConstant.REFRESH_TOKEN.equals(getTokenType(token));
    }

    public boolean isAccessToken(String token) {
        return JwtConstant.ACCESS_TOKEN.equals(getTokenType(token));
    }

    // ===================================================
    // PRIVATE METHODS
    // ===================================================

    private Claims parseClaims(String token) {

        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {

        return Keys.hmacShaKeyFor(
                jwtProperties.getSecret()
                        .getBytes(StandardCharsets.UTF_8)
        );
    }

    private List<String> extractRoles(
            Collection<? extends GrantedAuthority> authorities
    ) {
        return authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .toList();
    }
}