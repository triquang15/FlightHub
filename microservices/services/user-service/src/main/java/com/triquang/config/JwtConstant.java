// =======================================================
// package: com.triquang.config.JwtConstant
// =======================================================
package com.triquang.config;

public final class JwtConstant {

    public static final String JWT_HEADER = "Authorization";
    public static final String TOKEN_PREFIX = "Bearer ";

    public static final String CLAIM_ROLES = "roles";
    public static final String CLAIM_USER_ID = "userId";
    public static final String CLAIM_TOKEN_TYPE = "type";

    public static final String ACCESS_TOKEN = "ACCESS";
    public static final String REFRESH_TOKEN = "REFRESH";

    private JwtConstant() {
    }
}