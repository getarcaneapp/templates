# Node-RED

Open `http://localhost:1880` on the Docker host. The editor is initially unauthenticated, so it binds to loopback by default. Use an SSH tunnel or an authenticated reverse proxy for remote access; set `BIND_ADDRESS` only after configuring access controls.

Flows, installed nodes, credentials, and `settings.js` persist in the `node-red-data` volume. Follow the [security guide](https://nodered.org/docs/user-guide/runtime/securing-node-red) to configure `adminAuth` and a persistent `credentialSecret` in that file, then restart. Back up the entire volume.

[Upstream deployment documentation](https://nodered.org/docs/getting-started/docker).
