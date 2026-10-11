# SearXNG

The web interface binds to loopback by default. Open it on the Docker host or through an SSH tunnel. For LAN access, set `BIND_ADDRESS` to a trusted interface after completing account setup; use an authenticated HTTPS reverse proxy for remote access.

Generate `SEARXNG_SECRET` with `openssl rand -hex 32`, set `BASE_URL` to your reachable URL, and open that URL after deployment.

This is a private-instance configuration without authentication or a public-instance rate limiter. Restrict access to your LAN or an authenticated reverse proxy. Before operating a public instance, follow upstream guidance for Valkey, bot protection, and proxy headers.

Settings persist in `searxng-config`; customize `settings.yml` there and restart the service. Search engine availability depends on the upstream providers and their rate limits.

[Upstream deployment documentation](https://docs.searxng.org/admin/installation-docker.html).
