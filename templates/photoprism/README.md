# PhotoPrism

Private photo management with automatic indexing and search.

Copy `.env.example` to `.env`, replace every example secret with a unique generated value, adjust the settings, then deploy with `docker compose up -d` or import this template in Arcane. Open `http://localhost:2342` on the Docker host. Ports bind to localhost by default; set `BIND_ADDRESS` to a trusted interface for LAN access, or use a reverse proxy with HTTPS.

Set all three passwords, `SITE_URL`, and `ORIGINALS_PATH`. Login as `admin`. Originals are mounted read-only; this template supports indexing existing photos rather than uploads. Internal storage and MariaDB data use named volumes. Password changes after first boot must be made through PhotoPrism/database administration.

Named volumes retain internal application state across container upgrades. Keep a backup before updating images; `docker compose down -v` deletes named volume data.

Upstream: [installation and configuration](https://docs.photoprism.app/getting-started/docker-compose/).
