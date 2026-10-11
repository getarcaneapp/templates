# Tdarr

Distributed media transcoding with a bundled CPU worker.

## Deployment

Copy `.env.example` to `.env` (or enter its values in Arcane), set paths and credentials, and deploy `compose.yaml`. Open `http://HOST:APP_PORT` (default `8265`). Use reachable hostnames or host IPs for services in other Compose projects; `localhost` inside a container refers to that container.

The server includes an internal node (`internalNode=true`); no GPU devices or GPU runtime are required. Add a library under `/data` and review the configured CPU transcode/health-check workers in the Nodes page. Review plugins and test on copies before processing the library. Server state, configuration, logs, and transcode cache persist under `BASE_PATH`. `SERVER_PORT` (default 8266) exposes the server API for external nodes; the Web UI uses `APP_PORT` (default 8265). Authentication is enabled. Before deploying, set `TDARR_API_KEY` to `tapi_` followed by at least 32 random letters or digits. The same key authenticates the bundled node and seeds the initial `admin` password; change the password after signing in.

## Shared media paths

`DATA_PATH=/data/media` mounts the same host directory at `/data`. Use `/data/downloads` for downloads, `/data/tv`, `/data/movies`, and `/data/music` for libraries. Create these directories and grant the configured UID/GID access before deployment. Keep every participating application on the same host and container paths so imports and hardlinks work.

The existing Sonarr and Radarr templates use `/tv` or `/movies` and `/downloads`, and their default downloads host directory is `/data/downloads`. To adopt this layout, add `${DATA_PATH}:/data` to those deployments and update their root folders and download client paths. Alternatively, change this deployment's media mounts to exactly match their existing host and container paths. Do not point two different host directories at what appears to be the same downloads path. Bazarr needs matching library paths or explicit path mappings.

## Upstream documentation

- [Installation and configuration](https://docs.tdarr.io/docs/installation/docker/run-compose/)
- [Authentication](https://docs.tdarr.io/docs/other/authentication/)
