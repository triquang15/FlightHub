package com.triquang.service;

public interface SuspiciousLoginService {

    boolean isSuspicious(Long userId, String email, String deviceId, String ip);

    void handleSuspicious(Long userId, String email, String deviceId, String ip);
}