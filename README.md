# Blue Protocol Timer Panel

The BP Timer is a web panel for Blue Protocol: Star Resonance, designed to quickly view mob uptimes and track them in real-time. It is complemented by data from [winj's DPS Meter](https://github.com/winjwinj/bpsr-logs), which provides in-game data. The project is built with SvelteKit and PocketBase, and deployed to Cloudflare.

### Sections

- [Requirements](#requirements)
- [Getting started](#getting-started)
  - [Set up the development environment](#set-up-the-development-environment)
- [Production deployments](#production-deployments)
  - [Deploy the backend](#deploy-the-backend)
    - [Deploy on Fly.io](#deploy-on-flyio)
  - [Deploy the web app](#deploy-the-web-app)
- [The code](#the-code)
  - [Apps and Packages](#apps-and-packages)
  - [Utilities](#utilities)

## Requirements

[Bun](https://bun.com), [Docker](https://www.docker.com), and [Docker Compose](https://docs.docker.com/compose). Make sure Docker is running before getting started.

## Getting started

Create a new repository with the "use this template" button on GitHub, or run the following commands:

```sh
git clone https://github.com/woheedev/bptimer.git my-app

cd my-app
rm -rf .git

git init
git add -A
git commit -m "Initial commit"
```

### Set up the development environment

1.  Install dependencies:

    ```sh
    bun install
    ```

2.  Set up environment variables:

    ```sh
    cp ./apps/web/.env.example ./apps/web/.env
    ```

    Fill in the required values in `./apps/web/.env`:
    - `PB_ADMIN_EMAIL` and `PB_ADMIN_PASSWORD` for the initial Pocketbase admin account
    - `PUBLIC_POCKETBASE_BASE_URL=http://localhost:8090`
    - `PB_OAUTH2_DISCORD_CLIENT_ID` and `PB_OAUTH2_DISCORD_CLIENT_SECRET` for the Discord OAuth login which are obtained by creating an application in the [Discord Developer Portal](https://discord.com/developers/applications) under the OAuth2 section
    - Optionally, there are extra optional settings that can be applied automatically. Otherwise you can set them via pocketbase admin panel.

3.  Set Discord redirect URL:
    - Go to [Discord Developer Portal](https://discord.com/developers/applications) > OAuth2
    - Add `http://localhost:8090/api/oauth2-redirect` to redirect URL

4.  Start the development server and backend

    ```sh
    bun run dev
    ```

5.  [Create an account](http://localhost:5173/create-account) on the local web app, and [start building](http://localhost:5173/)

## CI/CD

This project includes GitHub Actions workflows for automated testing and deployment:

### Pull Request Checks

When you create a pull request, the CI workflow will:

- Install dependencies with `bun install --frozen-lockfile` (with caching)
- Format code with `bun run format`
- Lint code with `bun run lint`
- Run type checking with `bun run check`
- Run tests with `bun run test`
- Build the project with `bun run build`

### Production Deployment

When code is pushed to the `main` branch, the deploy workflow will:

- Run all the same checks as the PR workflow
- Deploy the web app to Cloudflare using `wrangler deploy`

### Setup Requirements

To use the deployment workflow, you'll need to add the following to your GitHub repository settings:

1. **Cloudflare API Token** (Secret):
   - Go to Secrets and variables > Actions > Secrets
   - Add `CLOUDFLARE_API_TOKEN` with your token from Cloudflare dashboard

2. **PocketBase URL** (Variable):
   - Go to Secrets and variables > Actions > Variables
   - Add `PUBLIC_POCKETBASE_BASE_URL` with your production URL (e.g., `https://db.bptimer.com`)

## Production deployments

Things to consider for production deployments:

1. [Add SMTP server settings](https://pocketbase.io/docs/going-to-production/#use-smtp-mail-server) for sending verification and reset password emails
   - Remember to edit the email templates from the PocketBase admin settings after deploying
2. [Integrate OAuth2 providers](https://pocketbase.io/docs/authentication/#oauth2-integration)
   - For Discord OAuth, update the redirect URI in your Discord app settings to point to your production domain (e.g., `https://db.bptimer.com/api/oauth2-redirect`)

### Deploy the backend

It is straightforward to [host PocketBase](https://pocketbase.io/docs/going-to-production/#deployment-strategies) on any VPS. This template comes configured for easy deployment of PocketBase on [Fly.io](https://fly.io).

#### Deploy on Fly.io

1. [Install flyctl](https://fly.io/docs/flyctl/install) – the open-source Fly.io CLI
2. Create an account with `fly auth signup` or log in with `fly auth login`
3. Create a new app

   ```sh
   fly apps create --generate-name
   ```

4. Add the generated app name to `apps/pocketbase/fly.toml` (line 1)
5. [Choose the region](https://fly.io/docs/reference/regions) closest to you (or your users) and add the corresponding region ID as the `primary_region` in `apps/pocketbase/fly.toml` (line 2)
6. Create a new volume, using the same region as the one you chose in step 5 (size can easily be [extended anytime](https://fly.io/docs/volumes/volume-manage/#extend-a-volume))

   ```sh
   fly volumes create pb_data --size=1 # Creates a volume with 1GB of storage
   ```

7. Deploy the Pocketbase server, and run this command again anytime you want to update the deployment after making changes locally

   ```sh
   bun run deploy
   ```

8. Go to the production PocketBase admin settings page at `https://APP_NAME.fly.dev/_` to create an admin account for the production backend
9. Create `./apps/web/.env.production` with your production PocketBase URL:

```
PUBLIC_POCKETBASE_BASE_URL=https://db.bptimer.com
```

The pre-configured VM is the cheapest available on Fly.io (`shared-cpu-1x` with 256MB of memory), [scale the backend vertically](https://fly.io/docs/launch/scale-machine) as your app grows.

Alternative: Add cloudflared tunnel to docker-compose and deploy. Point tunnel to http://pocketbase:8090

### Deploy the web app

Many cloud platforms provide generous free tiers for deploying web apps built with popular frameworks like SvelteKit. Cloudflare, Vercel, and Netlify are just a few examples of platforms that integrate directly with GitHub repositories and provide seamless CI/CD.

When setting up your first deployment on any of these platforms, remember to:

- Replace `@sveltejs/adapter-auto` with the [appropriate adapter](https://kit.svelte.dev/docs/adapters) in `apps/web/svelte.config.js`
- Specify `apps/web` as the root of the web app
- Add environment variables from `./apps/web/.env` to the deployment

## The code

### Apps and Packages

- `apps/pocketbase`: Dockerized [PocketBase](https://pocketbase.io) backend
- `apps/web`: [SvelteKit](https://kit.svelte.dev) app
- `packages/eslint-config-custom`: `eslint` configurations

### Utilities

This template has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org) for static type checking
- [ESLint](https://eslint.org) for code linting
- [Prettier](https://prettier.io) for code formatting

Project structure initially based on this [template](https://github.com/arrowban/sveltekit-pocketbase-turborepo-template/) and has been upgraded to the latest Svelte & PocketBase code.
