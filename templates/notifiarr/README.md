# Notifiarr

Connect self-hosted services to Notifiarr notifications and integrations.

## Deployment

Copy `.env.example` to `.env` (or enter its values in Arcane), set paths and credentials, and deploy `compose.yaml`. Open `http://HOST:APP_PORT` (default `5454`). Use reachable hostnames or host IPs for services in other Compose projects; `localhost` inside a container refers to that container.

A [Notifiarr.com](https://notifiarr.com/) account and its API key are required. Set `NOTIFIARR_API_KEY` and a unique, stable `CLIENT_HOSTNAME` before deployment. Find initial web credentials in container logs and configure service connections in the web interface/account. Outbound internet access is required. Host drive monitoring and user counts are not enabled: no privileged mode, Docker socket, or host identity mounts are included.

## Upstream documentation

- [Installation and configuration](https://notifiarr.wiki/pages/client/install/)
