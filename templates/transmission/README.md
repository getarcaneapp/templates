# Transmission

Lightweight BitTorrent client with a web interface and RPC API.

## Deployment

Copy `.env.example` to `.env` (or enter its values in Arcane), set paths and credentials, and deploy `compose.yaml`. Open `http://HOST:APP_PORT` (default `9091`). Use reachable hostnames or host IPs for services in other Compose projects; `localhost` inside a container refers to that container.

Set `RPC_USERNAME` and `RPC_PASSWORD` before deployment. Set the completed downloads directory to `/data/downloads/torrents` in the web interface. `TORRENT_PORT` is the peer port; forward the same port on your router if needed.

## Shared media paths

`DATA_PATH=/data/media` mounts the same host directory at `/data`. Use `/data/downloads` for downloads, `/data/tv`, `/data/movies`, and `/data/music` for libraries. Create these directories and grant the configured UID/GID access before deployment. Keep every participating application on the same host and container paths so imports and hardlinks work.

The existing Sonarr and Radarr templates use `/tv` or `/movies` and `/downloads`, and their default downloads host directory is `/data/downloads`. To adopt this layout, add `${DATA_PATH}:/data` to those deployments and update their root folders and download client paths. Alternatively, change this deployment's media mounts to exactly match their existing host and container paths. Do not point two different host directories at what appears to be the same downloads path. Bazarr needs matching library paths or explicit path mappings.

## Upstream documentation

- [Installation and configuration](https://docs.linuxserver.io/images/docker-transmission/)
