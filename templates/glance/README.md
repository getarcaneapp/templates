# Glance

The web interface binds to loopback by default. Open it on the Docker host or through an SSH tunnel. For LAN access, set `BIND_ADDRESS` to a trusted interface after completing account setup; use an authenticated HTTPS reverse proxy for remote access.

Open `http://localhost:8087`. Edit the inline `glance-config` section of the Compose file in Arcane to add feeds, service links, or additional pages, then redeploy. No separate configuration file download is needed.

The default dashboard has no authentication or Docker socket access. Restrict it to your LAN, or configure [Glance authentication](https://github.com/glanceapp/glance/blob/main/docs/configuration.md#authentication) before remote exposure. The supplied dashboard has no server-side persistent state; retain your edited Compose configuration.

[Upstream deployment documentation](https://github.com/glanceapp/glance/blob/main/docs/configuration.md).
