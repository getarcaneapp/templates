# Memos

A lightweight Markdown notes and knowledge management service.

Copy `.env.example` to `.env`, review the settings, then run `docker compose up -d`. In Arcane, import the template and supply the same environment variables. Use `docker compose ps` and `docker compose logs` to check startup.

Open `http://localhost:5230` and create the first account, which owns the instance. Set `INSTANCE_URL` to the address users visit. The volume stores SQLite and uploaded assets.

On a fresh database, the nonempty `INSTANCE_URL` initializes public instance access. This controls visitor access to the instance; each memo still has its own visibility setting and new memos are private by default. Before publishing a personal instance, select private `ACCESS` in the instance settings. Changing the URL after initialization does not change access policy.

Named volumes preserve server data across container recreation. Back up these volumes before upgrades; `docker compose down -v` deletes them. Set `PORT` to an unused host port. For remote browser access, put HTTPS in front of the application and update its public URL setting where provided.

Upstream documentation: [Memos deployment](https://usememos.com/docs/deploy/docker).
