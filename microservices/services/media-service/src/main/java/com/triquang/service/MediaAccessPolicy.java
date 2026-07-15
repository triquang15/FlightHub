package com.triquang.service;

import com.triquang.model.MediaEntityType;
import com.triquang.model.MediaFile;
import com.triquang.model.MediaPurpose;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Arrays;

@Component
public class MediaAccessPolicy {

    private static final String SYSTEM_ADMIN = "ROLE_SYSTEM_ADMIN";
    private static final String CUSTOMER = "ROLE_CUSTOMER";

    public void requireAdminIfGatewayRequest(String roles) {
        if (isGatewayRequest(roles) && !hasRole(roles, SYSTEM_ADMIN)) {
            throw new IllegalArgumentException("System admin access is required");
        }
    }

    public void authorizeUpload(
            Long gatewayUserId,
            String roles,
            Long ownerUserId,
            Long entityId,
            MediaEntityType entityType,
            MediaPurpose purpose
    ) {
        if (!isGatewayRequest(roles)) {
            return;
        }
        if (hasRole(roles, SYSTEM_ADMIN)) {
            return;
        }
        boolean ownAvatar = hasRole(roles, CUSTOMER)
                && entityType == MediaEntityType.USER_PROFILE
                && purpose == MediaPurpose.AVATAR
                && gatewayUserId != null
                && gatewayUserId.equals(ownerUserId)
                && gatewayUserId.equals(entityId);
        if (!ownAvatar) {
            throw new IllegalArgumentException("Media upload is not allowed for this account");
        }
    }

    public void authorizeRead(Long gatewayUserId, String roles, MediaFile mediaFile) {
        if (!isGatewayRequest(roles)) {
            return;
        }
        if (hasRole(roles, SYSTEM_ADMIN)) {
            return;
        }
        if (gatewayUserId != null && gatewayUserId.equals(mediaFile.getOwnerUserId())) {
            return;
        }
        throw new IllegalArgumentException("Media access is not allowed");
    }

    private boolean isGatewayRequest(String roles) {
        return StringUtils.hasText(roles);
    }

    private boolean hasRole(String roles, String requiredRole) {
        if (!StringUtils.hasText(roles) || !StringUtils.hasText(requiredRole)) {
            return false;
        }
        return Arrays.stream(roles.split(","))
                .map(String::trim)
                .anyMatch(requiredRole::equals);
    }
}
