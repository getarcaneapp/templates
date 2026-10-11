# Umami

The web interface binds to loopback by default. Open it on the Docker host or through an SSH tunnel. For LAN access, set `BIND_ADDRESS` to a trusted interface after completing account setup; use an authenticated HTTPS reverse proxy for remote access.

Generate independent values for all three secrets with `openssl rand -hex 32`. The two-factor key must be exactly 64 hexadecimal characters; keep it stable and back it up. A hexadecimal database password avoids URL-encoding issues in `DATABASE_URL`.

Open `http://localhost:3005`. The upstream initial login is `admin` / `umami`; change it immediately. Add your website in the UI and install its tracking script. Use HTTPS when collecting analytics from HTTPS sites.

PostgreSQL is bundled and persists in `umami-db`; its port is not published. Back up the database and both application secrets.

[Upstream deployment documentation](https://github.com/umami-software/umami/blob/master/docker-compose.yml).
