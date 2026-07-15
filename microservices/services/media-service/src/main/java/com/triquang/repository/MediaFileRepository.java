package com.triquang.repository;

import com.triquang.model.MediaFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface MediaFileRepository extends JpaRepository<MediaFile, Long>, JpaSpecificationExecutor<MediaFile> {

    Optional<MediaFile> findByStorageKey(String storageKey);

    List<MediaFile> findByEntityTypeAndEntityIdAndPurposeOrderByCreatedAtDesc(
            String entityType,
            Long entityId,
            String purpose
    );
}
