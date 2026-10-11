# wallabag

Save web articles for distraction-free reading and offline access.

Copy `.env.example` to `.env`, review the settings, then run `docker compose up -d`. In Arcane, import the template and supply the same environment variables. Replace every `change-me` value before starting. Generate independent secrets with `openssl rand -hex 32`; use hexadecimal database passwords so connection URLs need no escaping. Use `docker compose ps` and `docker compose logs` to check startup.

Open `PUBLIC_URL` and sign in with username `wallabag` and password `wallabag`. Change the default password immediately. This template uses the supported SQLite backend; the data and images volumes store saved content. Asynchronous Redis import workers are not enabled.

Named volumes preserve server data across container recreation. Back up these volumes before upgrades; `docker compose down -v` deletes them. Set `PORT` to an unused host port. For remote browser access, put HTTPS in front of the application and update its public URL setting where provided.

Upstream documentation: [wallabag deployment](https://github.com/wallabag/docker).
