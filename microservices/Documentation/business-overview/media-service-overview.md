# Media Service Overview

## Purpose

`media-service` centralizes file uploads and media metadata for FlightHub. It is
designed for local development now and for S3-compatible object storage later.

Typical consumers:

- User profile photos and identity media.
- Airline logos and onboarding brand assets.
- Airport, route, meal, ancillary, and landing-page imagery.
- Future operational documents can be added through a dedicated purpose policy
  when the owning workflow is ready.

## Current production contract

- `POST /api/media/upload` stores a file and returns metadata.
- `GET /api/media/{id}` returns metadata by id.
- `GET /api/media/entity/{entityType}/{entityId}/{purpose}` lists files attached
  to a business entity.
- `GET /api/media/file/{storageKey}` serves public local files.
- `DELETE /api/media/{id}?force=true` removes metadata and best-effort local
  storage. Linked business assets require the explicit `force=true` flag.
- `DELETE /api/media/storage-key?storageKey=...` is reserved for service
  cleanup after an owning business record has been updated.

## Storage model

The service stores:

- `storageProvider`: currently `LOCAL`, future `S3`.
- `storageKey`: a portable key such as `route/hero/<uuid>.webp`.
- `publicUrl`: the URL consumed by frontend components.
- owner, entity, purpose, visibility, content type, file size, and checksum.

This keeps UI and other services independent from the physical storage provider.

## Validation and safety

- Uploads are restricted by `entityType` and `purpose`; arbitrary strings are
  rejected before metadata is stored.
- User avatars accept JPG, PNG, and WEBP up to 5MB.
- Airline logos and ancillary icons accept JPG, PNG, WEBP, and SVG up to 5MB.
- Meal, airport hero, route hero, and landing hero images accept JPG, PNG, and
  WEBP up to 8MB.
- Business-linked uploads require an `entityId`; landing hero assets are the
  only current public asset type that can be uploaded without one.
- Local file serving rejects path traversal.
- Upload size is controlled by `MEDIA_MAX_FILE_SIZE_BYTES`.
- Public file serving is intentionally separate from authenticated metadata
  management so images can render directly in the browser.

## Access governance

- `/api/media/file/**` is public through API Gateway so images can render in
  traveler, owner, and admin pages.
- Metadata search, entity lookup, and force delete through API Gateway require
  `ROLE_SYSTEM_ADMIN`.
- Direct service-to-service calls without gateway role headers are allowed for
  trusted backend workflows such as user avatar, airline logo, airport hero,
  meal image, and ancillary icon cleanup.
- Non-admin gateway uploads are limited to a user's own
  `USER_PROFILE/AVATAR`; airline and operational media should be uploaded
  through the owning business service so ownership checks stay centralized.

## Migration path to S3

1. Set `app.media.storage-provider` from `LOCAL` to `S3`.
2. Configure bucket, region, optional CDN base URL, and credentials through
   `MEDIA_S3_*` environment variables.
3. Keep `storageKey`, metadata APIs, and frontend contracts unchanged.
4. Migrate existing local files by copying them to the same key path in S3 and
   updating `storageProvider` if needed.

The S3 adapter also supports S3-compatible storage such as MinIO by setting
`MEDIA_S3_ENDPOINT` and `MEDIA_S3_PATH_STYLE_ACCESS=true`.
