# Mailpit

Open `http://localhost:8025` on the Docker host. Configure development applications to send SMTP to host port `1025` without TLS or authentication. Mail is captured locally and is not delivered to real recipients.

Both ports bind to loopback by default because the inbox and SMTP listener are unauthenticated. For other containers, use an explicitly shared Docker network or a reachable host address after configuring appropriate access controls. Do not use `localhost` to reach this service from a different container.

Messages persist in `mailpit-data`; `MAX_MESSAGES` limits retained messages.

[Upstream deployment documentation](https://mailpit.axllent.org/docs/install/docker/).
