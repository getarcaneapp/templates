# SFTPGo

Managed SFTP file transfer with a web administration console.

Copy `.env.example` to `.env`, replace every example secret with a unique generated value, adjust the settings, then deploy with `docker compose up -d` or import this template in Arcane. Open `http://localhost:8080` on the Docker host. Ports bind to localhost by default; set `BIND_ADDRESS` to a trusted interface for LAN access, or use a reverse proxy with HTTPS.

Set administrator credentials before deploying, then open `/web/admin` and create file transfer users. Administrator credentials initialize a new database only; use the UI for later password changes. Only SFTP and the HTTP UI are exposed.

Named volumes retain internal application state across container upgrades. Keep a backup before updating images; `docker compose down -v` deletes named volume data.

Upstream: [installation and configuration](https://github.com/sftpgo/docs/blob/main/docs/docker.md).
