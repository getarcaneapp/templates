# Stirling PDF

The web interface binds to loopback by default. Open it on the Docker host or through an SSH tunnel. For LAN access, set `BIND_ADDRESS` to a trusted interface after completing account setup; use an authenticated HTTPS reverse proxy for remote access.

Set a unique `ADMIN_PASSWORD` before deploying, then open `http://localhost:8085` and sign in with `ADMIN_USERNAME` and that password. Initial-login variables initialize a fresh installation; change existing credentials through the application.

Configuration, OCR language files, and logs persist in named volumes. Add additional Tesseract language data to `stirling-data` when needed. Put the app behind HTTPS for remote use.

[Upstream deployment documentation](https://docs.stirlingpdf.com/).
