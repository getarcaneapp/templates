# RomM

Manage a ROM library with artwork, metadata, saves, and browser play.

Copy `.env.example` to `.env`, review the settings, then run `docker compose up -d`. In Arcane, import the template and supply the same environment variables. Replace every `change-me` value before starting. Generate independent secrets with `openssl rand -hex 32`; use hexadecimal database passwords so connection URLs need no escaping. Use `docker compose ps` and `docker compose logs` to check startup.

Open `http://localhost:8080` and create the initial administrator account. Set `LIBRARY_PATH` to an existing absolute host directory; `/data/media/roms` is the example. Ensure the container can read and write it. Populate that directory using the [upstream folder structure](https://docs.romm.app/latest/getting-started/folder-structure/), typically `roms/<platform>/`, then scan from the UI. The library is a bind mount; back it up separately from the named volumes.

Metadata providers are optional and configured independently: ScreenScraper needs a username and password; RetroAchievements and SteamGridDB need API keys; IGDB needs a Twitch application client ID and secret. Hasheous is enabled without credentials. See [metadata provider setup](https://docs.romm.app/latest/getting-started/metadata-providers/). Assets, resources, configuration, internal Redis state, and MariaDB each have persistent volumes.

Named volumes preserve server data across container recreation. Back up these volumes before upgrades; `docker compose down -v` deletes them. Set `PORT` to an unused host port. For remote browser access, put HTTPS in front of the application and update its public URL setting where provided.

Upstream documentation: [RomM deployment](https://docs.romm.app/latest/getting-started/quick-start/).
