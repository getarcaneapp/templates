# NocoDB

The web interface binds to loopback by default. Open it on the Docker host or through an SSH tunnel. For LAN access, set `BIND_ADDRESS` to a trusted interface after completing account setup; use an authenticated HTTPS reverse proxy for remote access.

Generate separate `DB_PASSWORD` and `JWT_SECRET` values with `openssl rand -hex 32`, and set `BASE_URL` to your reachable URL. Hexadecimal passwords avoid reserved characters in the database connection string.

Open `http://localhost:8086` and create the initial administrator before making the instance available to other users. Configure invitation and signup policies in the administration UI.

PostgreSQL is bundled without a published port. Back up both named volumes and retain `JWT_SECRET` across restarts.

[Upstream deployment documentation](https://github.com/nocodb/nocodb#docker-with-pg).
