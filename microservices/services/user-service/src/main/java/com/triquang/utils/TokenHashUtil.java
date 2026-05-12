package com.triquang.utils;

import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.stereotype.Component;

@Component
public class TokenHashUtil {
    public String hash(String token) {
        return DigestUtils.sha256Hex(token);
    }
}
