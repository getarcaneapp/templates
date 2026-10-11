# Minecraft Java Server

A persistent Minecraft Java Edition server with configurable resources.

Copy `.env.example` to `.env`, review the settings, then run `docker compose up -d`. In Arcane, import the template and supply the same environment variables. Replace every `change-me` value before starting. Generate independent secrets with `openssl rand -hex 32`; use hexadecimal database passwords so connection URLs need no escaping. Use `docker compose ps` and `docker compose logs` to check startup.

Read the [Minecraft EULA](https://www.minecraft.net/eula) and explicitly set `EULA=true` only if you accept it. The default intentionally refuses to start. Join using a Minecraft Java client at `localhost:25565`; online account authentication is enabled. First startup downloads the game server and may take several minutes.

`JAVA_MEMORY` controls the Java heap, `CONTAINER_MEMORY` caps the whole container, and `CPUS` limits CPU use. Leave memory above the heap for Java overhead. The `java25` image supports the current releases requiring Java 25; choose a compatible image tag for older game versions requiring another Java runtime. Pin `MINECRAFT_VERSION` for predictable updates. RCON has a configurable secret and is not published to the host. Use `docker compose exec minecraft rcon-cli` to administer the server. The data volume stores worlds, settings, and plugins.

Named volumes preserve server data across container recreation. Back up these volumes before upgrades; `docker compose down -v` deletes them. Set `PORT` to an unused host port. For remote players, publish or forward the selected TCP game port.

Upstream documentation: [Minecraft Java Server deployment](https://docker-minecraft-server.readthedocs.io/en/latest/).
