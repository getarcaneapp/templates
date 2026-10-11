# Linkwarden

Collaborative bookmarks with archived screenshots, PDFs, and search.

Copy `.env.example` to `.env`, review the settings, then run `docker compose up -d`. In Arcane, import the template and supply the same environment variables. Replace every `change-me` value before starting. Generate independent secrets with `openssl rand -hex 32`; use hexadecimal database passwords so connection URLs need no escaping. Use `docker compose ps` and `docker compose logs` to check startup.

Open `http://localhost:3000` and register the first user. Set `DISABLE_REGISTRATION=true` after provisioning users. `NEXTAUTH_URL` must include `/api/v1/auth` after the public origin. Bookmark records live in PostgreSQL, archives in the data volume, and search indexes in Meilisearch.

Named volumes preserve server data across container recreation. Back up these volumes before upgrades; `docker compose down -v` deletes them. Set `PORT` to an unused host port. For remote browser access, put HTTPS in front of the application and update its public URL setting where provided.

Upstream documentation: [Linkwarden deployment](https://docs.linkwarden.app/self-hosting/installation).
