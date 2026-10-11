# Unpackerr

Extract downloaded archives for Sonarr and Radarr imports.

## Deployment

Copy `.env.example` to `.env` (or enter its values in Arcane), set paths and credentials, and deploy `compose.yaml`. This service has no published web port. Use reachable hostnames or host IPs for services in other Compose projects; `localhost` inside a container refers to that container.

Set reachable Sonarr/Radarr URLs and API keys before deployment. The daemon uses environment configuration and has no web UI. It extracts archives for imports under `/data/downloads`. Archive deletion is disabled (`UN_*_0_DELETE_ORIG=false`); Unpackerr may remove extracted temporary files after import according to its normal lifecycle. Review upstream settings before changing cleanup behavior. It runs as `PUID:PGID`, so download directories must be writable.

## Shared media paths

`DATA_PATH=/data/media` mounts the same host directory at `/data`. Use `/data/downloads` for downloads, `/data/tv`, `/data/movies`, and `/data/music` for libraries. Create these directories and grant the configured UID/GID access before deployment. Keep every participating application on the same host and container paths so imports and hardlinks work.

The existing Sonarr and Radarr templates use `/tv` or `/movies` and `/downloads`, and their default downloads host directory is `/data/downloads`. To adopt this layout, add `${DATA_PATH}:/data` to those deployments and update their root folders and download client paths. Alternatively, change this deployment's media mounts to exactly match their existing host and container paths. Do not point two different host directories at what appears to be the same downloads path. Bazarr needs matching library paths or explicit path mappings.

## Upstream documentation

- [Installation and configuration](https://unpackerr.zip/docs/install/docker/)
