# Excalidraw

A browser-based whiteboard for hand-drawn diagrams and sketches.

Copy `.env.example` to `.env`, review the settings, then run `docker compose up -d`. In Arcane, import the template and supply the same environment variables. Use `docker compose ps` and `docker compose logs` to check startup.

Open `http://localhost:8080`; no account is needed. Drawings are stored in the browser, not in a server volume. Export `.excalidraw` files for backups and transferring drawings between browsers. This template serves the upstream static editor; it does not provide a private collaboration or sharing backend. The image is built with its upstream integration endpoints, so sharing features may contact external services.

Set `PORT` to an unused host port. For remote browser access, put HTTPS in front of the application and update its public URL setting where provided.

Upstream documentation: [Excalidraw deployment](https://github.com/excalidraw/excalidraw).
