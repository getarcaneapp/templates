# Karakeep

Save and search bookmarks, notes, and images with optional AI tagging.

Copy `.env.example` to `.env`, review the settings, then run `docker compose up -d`. In Arcane, import the template and supply the same environment variables. Replace every `change-me` value before starting. Generate independent secrets with `openssl rand -hex 32`; use hexadecimal database passwords so connection URLs need no escaping. Use `docker compose ps` and `docker compose logs` to check startup.

Open `NEXTAUTH_URL` and create the first account. Set `DISABLE_SIGNUPS=true` after provisioning users. The data volume stores SQLite and archived files; Meilisearch stores indexes. Chrome runs internally for crawling. AI features require additional provider configuration and are not enabled here.

Named volumes preserve server data across container recreation. Back up these volumes before upgrades; `docker compose down -v` deletes them. Set `PORT` to an unused host port. For remote browser access, put HTTPS in front of the application and update its public URL setting where provided.

Upstream documentation: [Karakeep deployment](https://docs.karakeep.app/installation/docker).
