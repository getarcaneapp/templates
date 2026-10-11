# Vikunja

Project and task management with lists, boards, and calendars.

Copy `.env.example` to `.env`, review the settings, then run `docker compose up -d`. In Arcane, import the template and supply the same environment variables. Replace every `change-me` value before starting. Generate independent secrets with `openssl rand -hex 32`; use hexadecimal database passwords so connection URLs need no escaping. Use `docker compose ps` and `docker compose logs` to check startup.

Open `PUBLIC_URL` and register your account. After registering all users, set `ENABLE_REGISTRATION=false` and recreate the application. The one-shot initialization service gives the files volume to the application UID 1000; PostgreSQL stores task data.

Named volumes preserve server data across container recreation. Back up these volumes before upgrades; `docker compose down -v` deletes them. Set `PORT` to an unused host port. For remote browser access, put HTTPS in front of the application and update its public URL setting where provided.

Upstream documentation: [Vikunja deployment](https://vikunja.io/docs/full-docker-example/).
