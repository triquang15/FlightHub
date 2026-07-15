package com.triquang.mapper;

import com.triquang.model.MediaFile;
import com.triquang.payload.MediaFileResponse;

public final class MediaFileMapper {

    private MediaFileMapper() {
    }

    public static MediaFileResponse toResponse(MediaFile mediaFile) {
        return new MediaFileResponse(
                mediaFile.getId(),
                mediaFile.getOwnerUserId(),
                mediaFile.getEntityType(),
                mediaFile.getEntityId(),
                mediaFile.getPurpose(),
                mediaFile.getOriginalFileName(),
                mediaFile.getContentType(),
                mediaFile.getSizeBytes(),
                mediaFile.getStorageProvider(),
                mediaFile.getStorageKey(),
                mediaFile.getPublicUrl(),
                mediaFile.getVisibility(),
                mediaFile.getChecksumSha256(),
                mediaFile.getCreatedAt(),
                mediaFile.getUpdatedAt()
        );
    }
}
