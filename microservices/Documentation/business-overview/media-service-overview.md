# Media Service Overview

## Purpose

`media-service` centralizes file uploads and media metadata for FlightHub. It is
designed for local development now and for S3-compatible object storage later.

Typical consumers:

- User profile photos and identity media.
- Airline logos and onboarding brand assets.
- Airport, route, meal, ancillary, and landing-page imagery.
- Operational documents such as PDF attachments when needed.

## Current production contract

- `POST /api/media/upload` stores a file and returns metadata.
- `GET /api/media/{id}` returns metadata by id.
- `GET /api/media/entity/{entityType}/{entityId}/{purpose}` lists files attached
  to a business entity.
- `GET /api/media/file/{storageKey}` serves public local files.
- `DELETE /api/media/{id}` removes metadata and best-effort local storage.

## Storage model

The service stores:

- `storageProvider`: currently `LOCAL`, future `S3`.
- `storageKey`: a portable key such as `route/hero/<uuid>.webp`.
- `publicUrl`: the URL consumed by frontend components.
- owner, entity, purpose, visibility, content type, file size, and checksum.

This keeps UI and other services independent from the physical storage provider.

## Validation and safety

- Allowed content types are images and PDF.
- Local file serving rejects path traversal.
- Upload size is controlled by `MEDIA_MAX_FILE_SIZE_BYTES`.
- Public file serving is intentionally separate from authenticated metadata
  management so images can render directly in the browser.

## Migration path to S3

1. Add an S3 implementation of `MediaStorageService`.
2. Switch `app.media.storage-provider` from `LOCAL` to `S3`.
3. Keep `storageKey`, metadata APIs, and frontend contracts unchanged.
4. Migrate existing local files by copying them to the same key path in S3 and
   updating `storageProvider` if needed.
