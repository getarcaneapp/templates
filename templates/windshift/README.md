# Windshift

[Windshift](https://windshift.sh/) is a self-hosted work management platform for planning projects, shaping workflows, and collaborating while keeping control of your data.

## Before deploying

Review the template environment variables:

1. Leave `BASE_URL` empty to use `http://localhost:<APP_PORT>`, or set it to the complete public URL you will use to access Windshift.
2. Replace `SSO_SECRET` with the output of `openssl rand -hex 32`.
3. Replace `POSTGRES_PASSWORD` with a strong, unique password.

For a production deployment, put Windshift behind an HTTPS reverse proxy and set `BASE_URL` to its public HTTPS URL. Windshift automatically detects proxy mode when `BASE_URL` uses HTTPS and the container does not have a TLS certificate.

## First run

Deploy the project, open the configured `BASE_URL`, and follow the setup wizard to create the first administrator and workspace.

The `windshift-data` volume stores attachments, plugins, and other application data. The `postgres-data` volume stores the database. Back up both volumes.

See the [Windshift documentation](https://windshift.sh/docs) for configuration, integrations, and upgrades.
