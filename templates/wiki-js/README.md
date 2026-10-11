# Wiki.js

A collaborative wiki with Markdown editing and flexible authentication.

Copy `.env.example` to `.env`, review the settings, then run `docker compose up -d`. In Arcane, import the template and supply the same environment variables. Replace every `change-me` value before starting. Generate independent secrets with `openssl rand -hex 32`; use hexadecimal database passwords so connection URLs need no escaping. Use `docker compose ps` and `docker compose logs` to check startup.

Open `http://localhost:8080` and complete the setup wizard to choose the administrator email, password, and site URL. PostgreSQL stores pages, assets, and settings. Configure the public URL in the wizard or administration settings if using a reverse proxy.

Named volumes preserve server data across container recreation. Back up these volumes before upgrades; `docker compose down -v` deletes them. Set `PORT` to an unused host port. For remote browser access, put HTTPS in front of the application and update its public URL setting where provided.

Upstream documentation: [Wiki.js deployment](https://docs.requarks.io/install/docker).
