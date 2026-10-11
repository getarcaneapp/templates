# Gitea

The web interface binds to loopback by default. Open it on the Docker host or through an SSH tunnel. For LAN access, set `BIND_ADDRESS` to a trusted interface after completing account setup; use an authenticated HTTPS reverse proxy for remote access.

Set `DOMAIN` and `BASE_URL` to the hostname and URL users will access, then open that URL to complete the installation wizard. Keep SQLite selected and create the administrator in the wizard; public registration is disabled.

SSH clone URLs use `SSH_PORT` (default `2223`). If you change the HTTP port, update `BASE_URL` too. Repositories, configuration, and the SQLite database persist in `gitea-data`; back up the whole volume. This template does not install an Actions runner.

[Upstream deployment documentation](https://docs.gitea.com/installation/install-with-docker/).
