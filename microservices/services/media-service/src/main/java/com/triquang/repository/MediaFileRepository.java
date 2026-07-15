package com.triquang.repository;

import com.triquang.model.MediaFile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MediaFileRepository extends JpaRepository<MediaFile, Long> {

    Optional<MediaFile> findByStorageKey(String storageKey);

    List<MediaFile> findByEntityTypeAndEntityIdAndPurposeOrderByCreatedAtDesc(
            String entityType,
            Long entityId,
            String purpose
    );
}
