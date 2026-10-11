# PairDrop

Peer to peer file sharing between devices through a web browser.

Copy `.env.example` to `.env`, adjust the settings, then deploy with `docker compose up -d` or import this template in Arcane. Open `http://localhost:3000` on the Docker host. Ports bind to localhost by default; set `BIND_ADDRESS` to a trusted interface for LAN access, or use a reverse proxy with HTTPS.

PairDrop has no account login. Use on a trusted network; place public deployments behind HTTPS and appropriate proxy access controls. `WS_FALLBACK=true` allows relayed transfers when WebRTC fails. No durable server state is required.

File transfers are peer to peer; the server does not keep uploaded files or require persistent volumes.

Upstream: [installation and configuration](https://github.com/schlagmichdoch/PairDrop/blob/master/docs/host-your-own.md).
