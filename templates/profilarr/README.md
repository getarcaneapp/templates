# Profilarr

Manage and synchronize quality profiles and custom formats for Arr applications.

## Deployment

Copy `.env.example` to `.env` (or enter its values in Arcane), set paths and credentials, and deploy `compose.yaml`. Open `http://HOST:APP_PORT` (default `6868`). Use reachable hostnames or host IPs for services in other Compose projects; `localhost` inside a container refers to that container.

Create your account on first access, connect a configuration database and your Arr instances using their URLs/API keys, and review proposed changes before enabling sync. This template uses the current v2 image and port 6868. The optional parser service for custom-format/quality-profile testing is not included; basic linking and synchronization do not require it. No database or automatic sync policy is preselected.

## Upstream documentation

- [Installation and configuration](https://github.com/Dictionarry-Hub/profilarr)
