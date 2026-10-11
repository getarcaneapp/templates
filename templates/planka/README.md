# Planka

Collaborative Kanban boards for organizing projects and tasks.

Copy `.env.example` to `.env`, review the settings, then run `docker compose up -d`. In Arcane, import the template and supply the same environment variables. Replace every `change-me` value before starting. Generate independent secrets with `openssl rand -hex 32`; use hexadecimal database passwords so connection URLs need no escaping. Use `docker compose ps` and `docker compose logs` to check startup.

Sign in at `BASE_URL` with `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Admin settings provision the initial account; leaving them configured also prevents editing or deleting that account. Uploaded files live in the data volume and boards in PostgreSQL.

Named volumes preserve server data across container recreation. Back up these volumes before upgrades; `docker compose down -v` deletes them. Set `PORT` to an unused host port. For remote browser access, put HTTPS in front of the application and update its public URL setting where provided.

Upstream documentation: [Planka deployment](https://docs.planka.cloud/docs/installation/docker/production-version/).
