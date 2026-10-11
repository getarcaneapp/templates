# Copyparty

Authenticated file sharing, uploads, and media browsing.

Copy `.env.example` to `.env`, replace every example secret with a unique generated value, adjust the settings, then deploy with `docker compose up -d` or import this template in Arcane. Open `http://localhost:3923` on the Docker host. Ports bind to localhost by default; set `BIND_ADDRESS` to a trusted interface for LAN access, or use a reverse proxy with HTTPS.

Set a strong `PASSWORD`, create `FILES_PATH`, and ensure it is writable by the container user. The configured account has full control of the shared directory; anonymous users have no volume permissions. Avoid colons in usernames/passwords because the upstream command format uses them as delimiters. Back up the host files directory. Indexes and thumbnails use the named state volume.

Named volumes retain internal application state across container upgrades. Keep a backup before updating images; `docker compose down -v` deletes named volume data.

Upstream: [installation and configuration](https://github.com/9001/copyparty/blob/hovudstraum/scripts/docker/README.md).
