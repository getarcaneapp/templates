# Homedex

Read-only inventory for a homelab. Homedex records the services, hosts, ports, routes, certificates, domains and changes it discovers from Docker, Proxmox VE, Tailscale and reverse proxies (Traefik, Caddy, Nginx Proxy Manager, nginx), and never starts, stops or reconfigures anything.

## Setup

1. Set `HOMEDEX_ADMIN_PASSWORD` (12 or more characters) in `.env` before the first start. Homedex stores only its Argon2id hash and ignores the value once an admin exists.
2. The UI is published on `127.0.0.1:7377`. To reach it from other machines, set `HOMEDEX_BIND=0.0.0.0` (keep the admin password set).
3. Open Homedex, sign in, and keep the prefilled Docker endpoint `tcp://docker-socket-proxy:2375` for the first source.

## Docker access

Only `docker-socket-proxy` (`tecnativa/docker-socket-proxy:v0.4.2`) mounts `/var/run/docker.sock`, read only. It allows GET on containers, images, networks, info and version, refuses every write (`POST=0`), publishes no port, and sits on an `internal: true` network shared only with Homedex. Homedex runs as UID 65532 with a read-only root filesystem and all capabilities dropped.

## Links

- Source and docs: https://github.com/HarshShah0203/homedex
- Connector guide: https://github.com/HarshShah0203/homedex/blob/main/docs/CONNECTORS.md
- Live demo (fabricated data): https://harshshah0203.github.io/homedex/
