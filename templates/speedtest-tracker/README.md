# Speedtest Tracker

Schedule internet speed tests and chart connection performance.

Copy `.env.example` to `.env`, replace every example secret with a unique generated value, adjust the settings, then deploy with `docker compose up -d` or import this template in Arcane. Open `http://localhost:8085` on the Docker host. Ports bind to localhost by default; set `BIND_ADDRESS` to a trusted interface for LAN access, or use a reverse proxy with HTTPS.

Set `APP_KEY` to `base64:` followed by the output of `openssl rand -base64 32`; keep this key stable. Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `APP_URL` before the first launch. Credentials seed the initial account only. Tests consume bandwidth; adjust the cron schedule as needed. SQLite stores results in the named configuration volume.

Named volumes retain internal application state across container upgrades. Keep a backup before updating images; `docker compose down -v` deletes named volume data.

Upstream: [installation and configuration](https://docs.linuxserver.io/images/docker-speedtest-tracker/).
