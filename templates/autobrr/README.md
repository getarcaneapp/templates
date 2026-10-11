# autobrr

IRC announce monitoring and filtered download automation.

## Deployment

Copy `.env.example` to `.env` (or enter its values in Arcane), set paths and credentials, and deploy `compose.yaml`. Open `http://HOST:APP_PORT` (default `7474`). Use reachable hostnames or host IPs for services in other Compose projects; `localhost` inside a container refers to that container.

Create `${BASE_PATH}/config` writable by `PUID:PGID`. The application creates its configuration on first start; create an account in the web interface, then add IRC/indexer credentials, download clients, and filters. This template selects no trackers or automatic download filters. It uses a SQLite database persisted under `/config`.

## Upstream documentation

- [Installation and configuration](https://autobrr.com/installation/docker/)
