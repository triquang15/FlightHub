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
    private String secret;

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