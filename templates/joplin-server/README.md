# Joplin Server

A private synchronization server for Joplin notes and attachments.

Copy `.env.example` to `.env`, review the settings, then run `docker compose up -d`. In Arcane, import the template and supply the same environment variables. Replace every `change-me` value before starting. Generate independent secrets with `openssl rand -hex 32`; use hexadecimal database passwords so connection URLs need no escaping. Use `docker compose ps` and `docker compose logs` to check startup.

Open `APP_BASE_URL` and sign in as `admin@localhost` with password `admin`. Immediately change the administrator email and password, then create a regular user for note synchronization. Configure that user and the server URL in the Joplin client. All notes and attachments persist in PostgreSQL. Transcription is disabled and not included.

Named volumes preserve server data across container recreation. Back up these volumes before upgrades; `docker compose down -v` deletes them. Set `PORT` to an unused host port. For remote browser access, put HTTPS in front of the application and update its public URL setting where provided.

Upstream documentation: [Joplin Server deployment](https://github.com/laurent22/joplin/blob/dev/packages/server/README.md).
