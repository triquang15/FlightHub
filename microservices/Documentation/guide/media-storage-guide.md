# FlightHub Media Storage Guide

Use this guide for upload/media behavior across modules. The local runbook only
contains enough information to start services.

## Shared Media Service

New cross-module uploads should prefer `media-service` instead of adding file
storage code to each business service. It stores metadata in `media_files`,
saves local files under `MEDIA_STORAGE_PATH`, and returns a public URL from:

```text
/api/media/file/{storageKey}
```

Local settings:

```bash
MEDIA_DATASOURCE_URL=jdbc:postgresql://localhost:5441/media_service_db
MEDIA_STORAGE_PATH=uploads/media
MEDIA_STORAGE_PROVIDER=LOCAL
MEDIA_PUBLIC_BASE_URL=http://localhost:8080
MEDIA_MAX_FILE_SIZE_BYTES=8388608
MEDIA_SERVICE_BASE_URL=http://localhost:8089
```

S3-ready settings:

```bash
MEDIA_S3_BUCKET=
MEDIA_S3_REGION=us-east-1
MEDIA_S3_PUBLIC_BASE_URL=
MEDIA_S3_ENDPOINT=
MEDIA_S3_PATH_STYLE_ACCESS=false
MEDIA_S3_ACCESS_KEY_ID=
MEDIA_S3_SECRET_ACCESS_KEY=
```

For MinIO or another S3-compatible endpoint:

```bash
MEDIA_S3_ENDPOINT=http://localhost:9000
MEDIA_S3_PATH_STYLE_ACCESS=true
```

If `MEDIA_S3_ACCESS_KEY_ID` and `MEDIA_S3_SECRET_ACCESS_KEY` are empty, the
service uses the AWS default credentials provider chain.

## Entity Metadata

Use entity metadata to attach files without coupling storage to one service:

```text
entityType=USER_PROFILE | AIRLINE | AIRPORT | ROUTE | MEAL | ANCILLARY | LANDING
entityId=<business id>
purpose=AVATAR | LOGO | HERO | IMAGE | ICON
```

## Upload Policy

| Entity | Purpose | Types | Limit | Notes |
| --- | --- | --- | --- | --- |
| USER_PROFILE | AVATAR | JPG, PNG, WEBP | 5MB | Requires `entityId` |
| AIRLINE | LOGO | JPG, PNG, WEBP, SVG | 5MB | Requires `entityId` |
| MEAL | IMAGE | JPG, PNG, WEBP | 8MB | Requires `entityId` |
| ANCILLARY | ICON | JPG, PNG, WEBP, SVG | 5MB | Requires `entityId` |
| AIRPORT | HERO | JPG, PNG, WEBP | 8MB | Requires `entityId` |
| ROUTE | HERO | JPG, PNG, WEBP | 8MB | Requires `entityId` |
| LANDING | HERO | JPG, PNG, WEBP | 8MB | Does not require `entityId` |

Admin delete by media id requires `force=true` for linked business assets.
Service-to-service cleanup should use delete by `storageKey` after the owning
business record has been updated.

## Current Upload Owners

Profile photos:

```text
users.avatar_url
users.avatar_object_key
users.avatar_updated_at
```

Airport route images:

```text
airports.hero_image_url
airports.hero_image_object_key
```

Airline logos:

```text
airlines.logo_url
airlines.logo_object_key
```

Meal catalog images:

```text
meals.image_url
meals.image_object_key
```

Master ancillary icons:

```text
ancillaries.icon_url
ancillaries.icon_object_key
```

Existing legacy avatar, airport, airline, meal, and ancillary upload endpoints
remain supported for backward compatibility. New uploads should route through
`media-service`.

## Module-Specific Local Settings

User profile avatars:

```bash
USER_AVATAR_MAX_FILE_SIZE=5MB
USER_AVATAR_MAX_REQUEST_SIZE=6MB
```

Airport legacy fallback:

```bash
AIRPORT_MEDIA_STORAGE_DIR=/tmp/flighthub/airport-media
```

Airline logo legacy fallback:

```bash
AIRLINE_LOGO_STORAGE_DIR=/tmp/flighthub/airline-logos
```

Meal legacy fallback:

```bash
MEAL_IMAGE_STORAGE_DIR=/tmp/flighthub/meal-images
MEAL_IMAGE_MAX_FILE_SIZE=8MB
MEAL_IMAGE_MAX_REQUEST_SIZE=9MB
```

Ancillary legacy fallback:

```bash
ANCILLARY_ICON_STORAGE_DIR=/tmp/flighthub/ancillary-icons
ANCILLARY_MEDIA_MAX_FILE_SIZE=8MB
ANCILLARY_MEDIA_MAX_REQUEST_SIZE=9MB
```

## Migration To S3

To migrate from local disk to S3-compatible storage:

1. Keep business DTO/controller contracts unchanged.
2. Set `MEDIA_STORAGE_PROVIDER=S3`.
3. Fill bucket, region, credentials, and optional endpoint variables.
4. Keep business services storing only public URL and object/storage key.
5. Move file serving behind a CDN when available.
