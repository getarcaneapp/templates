# DockRoute

External-DNS for plain Docker hosts — the same idea as Kubernetes
[external-dns](https://github.com/kubernetes-sigs/external-dns), but for a
single Docker machine. DockRoute watches your running containers, reads
`dockroute.*` labels and reconciles the matching DNS records (and Cloudflare
Tunnel routes) in a pluggable provider.

It **never alters what it cannot prove it manages**: every record it creates
gets a companion TXT ownership record, and anything without that proof is
logged and skipped.

## Setup

1. Set `DOCKER_SOCK_GID` in the environment to the group that owns your
   Docker socket (`stat -c '%g' /var/run/docker.sock`) — the image runs as a
   non-root user.
2. Leave `DOCKROUTE_PROVIDER=log` for a zero-credential dry run, or set it to
   `cloudflare` and fill in `CLOUDFLARE_API_TOKEN`.
3. Opt containers in with labels:

```yaml
services:
  whoami:
    image: traefik/whoami
    labels:
      dockroute.enabled: "true"
      dockroute.hostname: "whoami.example.com"
      # optional — publish through an existing Cloudflare Tunnel:
      dockroute.tunnel.service: "http://whoami:80"
```

Full label and configuration reference:
https://github.com/Dockroute/Dockroute#readme
