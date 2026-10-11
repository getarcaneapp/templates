# Navidrome

Personal music streaming server with Subsonic-compatible clients.

## Deployment

Copy `.env.example` to `.env` (or enter its values in Arcane), set paths and credentials, and deploy `compose.yaml`. Open `http://HOST:APP_PORT` (default `4533`). Use reachable hostnames or host IPs for services in other Compose projects; `localhost` inside a container refers to that container.

Create the administrator account on first access. `MUSIC_PATH` is mounted read-only at `/music`. Create `${BASE_PATH}/data` and make it writable by `PUID:PGID` before deployment; this image uses Compose `user`, not LinuxServer environment variables.

## Upstream documentation

- [Installation and configuration](https://www.navidrome.org/docs/installation/docker/)
