# Maintainerr

Rule-based media collection and lifecycle management for Plex.

## Deployment

Copy `.env.example` to `.env` (or enter its values in Arcane), set paths and credentials, and deploy `compose.yaml`. Open `http://HOST:APP_PORT` (default `6246`). Use reachable hostnames or host IPs for services in other Compose projects; `localhost` inside a container refers to that container.

Create `${BASE_PATH}/data` and make it writable by `PUID:PGID` before deployment. Connect Plex and optional Arr services in the web interface. This template installs no collection, deletion, or retention rules. Review matches and collection behavior before enabling actions. Direct leftover-folder cleanup is unavailable until you deliberately add a matching media mount.

## Upstream documentation

- [Installation and configuration](https://docs.maintainerr.info/installation/)
