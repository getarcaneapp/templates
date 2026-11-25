# FCaptcha

FCaptcha serves a browser widget and verifies its tokens on your server. The project is MIT-licensed.

## Deployment

1. Run `openssl rand -hex 32` twice and set `FCAPTCHA_SECRET` and `FCAPTCHA_VERIFY_SECRET` to the two different values. Keep both server-side.
2. Deploy the template. By default the host serves FCaptcha at `http://127.0.0.1:3000`. Set `FCAPTCHA_HOST_PORT` if that port is in use.
3. From the Docker host, open `/demo/` to try the widget and check `/health` to verify that the service is running.
4. For access from other devices, route HTTPS through your reverse proxy and configure `FCAPTCHA_BIND_ADDRESS` if the proxy cannot reach the loopback listener. Load `/fcaptcha.js` from the resulting origin. Use the verification secret from your application's backend to verify tokens through `/siteverify` before performing the protected action. Keep the signing secret on the verifier.

Follow the [FCaptcha Docker guide](https://github.com/WebDecoy/FCaptcha/tree/main/docker) and the [integration guide](https://github.com/WebDecoy/FCaptcha#try-it-in-60-seconds) for first-run and application setup details.
