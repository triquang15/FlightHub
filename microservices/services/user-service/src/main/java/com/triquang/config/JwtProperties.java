// =======================================================
// package: com.triquang.config.JwtProperties
// =======================================================
package com.triquang.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;

@Data
@Component
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {

    /**
     * Put in ENV:
     * JWT_SECRET=very-long-random-secret-key-256-bit-minimum
     */
    private String secret = "9f4c1d7a2e6b3c8f5a0d9e4b7c2f1a8e6d3c0b9a7f5e2d1c8b4a6f3d9e0c2b7a";

    /**
     * 15 minutes
     */
    private long accessTokenExpiration = 900000;

    /**
     * 7 days
     */
    private long refreshTokenExpiration = 604800000;

    /**
     * issuer name
     */
    private String issuer = "FlightHub";
      
}