# Trilium Notes

Hierarchical notes with rich editing and personal knowledge management.

Copy `.env.example` to `.env`, review the settings, then run `docker compose up -d`. In Arcane, import the template and supply the same environment variables. Use `docker compose ps` and `docker compose logs` to check startup.

Open `http://localhost:8080` and complete the first-run setup to create a password or connect to an existing Trilium server. The data volume stores notes and attachments. Match the server version with desktop clients when using synchronization.

Named volumes preserve server data across container recreation. Back up these volumes before upgrades; `docker compose down -v` deletes them. Set `PORT` to an unused host port. For remote browser access, put HTTPS in front of the application and update its public URL setting where provided.

Upstream documentation: [Trilium Notes deployment](https://docs.triliumnotes.org/user-guide/setup/server/installation/docker).
