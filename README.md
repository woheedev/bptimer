# BPTimer

A web panel and companion app for Blue Protocol: Star Resonance to view mob uptimes and track them in real-time.

## Quick Start

**Requirements:** [Bun](https://bun.sh), [Docker](https://www.docker.com)

```sh
git clone https://github.com/woheedev/bptimer.git
cd bptimer
bun install
```

Set up environment variables for web panel:

```sh
cp ./apps/web/.env.example ./apps/web/.env
```

Fill in `./apps/web/.env`:

- `PB_ADMIN_EMAIL` and `PB_ADMIN_PASSWORD` for the PocketBase admin (password must be 8+ characters)
- `PUBLIC_POCKETBASE_BASE_URL=http://localhost:8090`
- `PB_OAUTH2_DISCORD_CLIENT_ID` and `PB_OAUTH2_DISCORD_CLIENT_SECRET` from [Discord Developer Portal](https://discord.com/developers/applications)
  - Add `http://localhost:8090/api/oauth2-redirect` as a redirect URL

Start everything:

```sh
bun run dev
```

This starts both the PocketBase backend (via Docker) and the vite dev server.

Open <http://localhost:5173> and log in via Discord.

## Apps

| App                                  | Description                                                                   |
| ------------------------------------ | ----------------------------------------------------------------------------- |
| [`apps/web`](apps/web)               | SvelteKit web app (currently deployed to Cloudflare)                          |
| [`apps/pocketbase`](apps/pocketbase) | PocketBase backend with custom Go hooks (deployed behind a Cloudflare Tunnel) |
| [`apps/desktop`](apps/desktop)       | Native overlay companion app for mob / dps tracking (Rust/egui)               |

## Packages

| Package                                                      | Description                                                                                                |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| [`packages/bptimer-api-client`](packages/bptimer-api-client) | API client for submitting boss HP data ([npm](https://www.npmjs.com/package/@woheedev/bptimer-api-client)) |

## Production

For production deployments:

- **Web**: Deploy to Cloudflare (or any platform that can host a static SvelteKit app). Set `PUBLIC_POCKETBASE_BASE_URL` to your production PocketBase URL.
- **PocketBase**: Run via Docker on any VPS. Configure SMTP for emails and update Discord OAuth redirect URL. Can also run binary directly ideally using Systemd service.
