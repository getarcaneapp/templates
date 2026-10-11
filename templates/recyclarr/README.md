# Recyclarr

Scheduled synchronization of Sonarr and Radarr quality definitions.

## Deployment

Copy `.env.example` to `.env` (or enter its values in Arcane), set paths and credentials, and deploy `compose.yaml`. This service has no published web port. Use reachable hostnames or host IPs for services in other Compose projects; `localhost` inside a container refers to that container.

Set reachable `SONARR_URL`, `RADARR_URL`, and their API keys before deployment. The inline Compose config provides series/movie quality-size definitions without requiring a separate config file. Compose 2.23.1 or newer is required for `configs.content`. Create `${BASE_PATH}/config` writable by `PUID:PGID`. Back up Arr settings, then run `docker compose run --rm recyclarr sync --preview` to inspect changes. The running service synchronizes daily (configurable with `CRON_SCHEDULE`). This changes quality definitions; it creates no deletion rules. Edit the inline config to add desired profiles and custom formats. Credentials live in `.env` and must be protected.

## Upstream documentation

- [Installation and configuration](https://recyclarr.dev/guide/installation/docker/)
- [Quality definitions](https://recyclarr.dev/reference/configuration/quality-definition/)
