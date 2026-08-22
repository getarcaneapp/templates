# Kiwix Server

[kiwix-serve](https://wiki.kiwix.org/wiki/Kiwix-serve) is a lightweight web server
that allows you to serve ZIM archives.

## Before deploying

Review the template environment variables:

1. Set `APP_PORT` to the port you want to use for the Kiwix server (default is 8080).
2. Set `ZIM_PATH` to the directory where you want to store ZIM files.
   This directory should be writable by the container and
   needs to contain at least one `.zim` file.
3. Optionally set `DOWNLOAD_URL` to the URL of a ZIM file to download on startup.
   This variable only takes one URL.
