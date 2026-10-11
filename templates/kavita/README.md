# Kavita

Digital library server for comics, manga, and ebooks.

## Deployment

Copy `.env.example` to `.env` (or enter its values in Arcane), set paths and credentials, and deploy `compose.yaml`. Open `http://HOST:APP_PORT` (default `5000`). Use reachable hostnames or host IPs for services in other Compose projects; `localhost` inside a container refers to that container.

Create the administrator account on first access and add a library from `/books`. `BOOKS_PATH` is read-only; configuration, the database, and covers persist under `${BASE_PATH}/config`.

## Upstream documentation

- [Installation and configuration](https://wiki.kavitareader.com/installation/docker/)
