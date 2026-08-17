# Eximinq CloudDesk

React/Vite CloudDesk dashboard with a local Express API and PostgreSQL persistence.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set the database and application secrets.
3. Create the PostgreSQL database/role, then run `npm run db:migrate` and `npm run db:seed`.
4. Start the API with `npm run dev:api`.
5. In a second terminal, start the frontend with `npm run dev`.

Frontend: `http://localhost:5173`  
API health: `http://localhost:4001/health`

## pgAdmin connection

Register a server with host `localhost`, port `5432`, maintenance database `eximinq_clouddesk_app`, and the application database user from `.env`. Do not commit `.env`.

## Local and production databases

The backend always reads one variable: `DATABASE_URL`. It does not contain separate hard-coded local and production credentials.

### Local development

Keep one local connection in the ignored `.env` file:

```dotenv
NODE_ENV=development
DATABASE_URL=postgresql://clouddesk_app:YOUR_LOCAL_PASSWORD@localhost:5432/eximinq_clouddesk_app
DATABASE_SSL=auto
```

`dotenv` loads this file when the API, migration, or seed command runs. With `DATABASE_SSL=auto`, localhost connections do not use TLS.

### Test the Neon database from your local machine

Create an ignored `.env.neon.local` file. This keeps the live-test connection available without mixing two `DATABASE_URL` values in `.env`:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@NEON_HOST/DB_NAME?sslmode=require&channel_binding=require
DATABASE_SSL=auto
PORT=4001
APP_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://YOUR_LAN_IP:5173
JWT_SECRET=YOUR_TEST_SECRET
```

Then use:

```bash
npm run dev:api:neon
npm run db:migrate:neon
```

Use `npm run dev:api` to switch back to the local PostgreSQL database. Both modes still expose the selected connection through `process.env.DATABASE_URL`.

### Production with Neon

Do not add the Neon URL to `.env`, `.env.example`, source code, or GitHub. In the deployment provider's environment-variable settings, configure:

```dotenv
NODE_ENV=production
DATABASE_URL=postgresql://USER:PASSWORD@NEON_HOST/DB_NAME?sslmode=require&channel_binding=require
DATABASE_SSL=auto
JWT_SECRET=YOUR_PRODUCTION_SECRET
APP_ORIGINS=https://YOUR_FRONTEND_DOMAIN
```

Redeploy after changing environment variables. The hosting platform injects its `DATABASE_URL` into the process, and `dotenv` does not overwrite an already-injected value. Neon hosts and production mode automatically enable verified TLS. Production startup also rejects a `DATABASE_URL` that points to localhost.

Run `npm run db:migrate` against Neon from a trusted deployment job or shell that has the production `DATABASE_URL`. Seed production only when explicitly required.

## Live demo deployment

### Render API

The committed `render.yaml` creates the Express web service, runs `npm start`, and checks `/health`. Secret values use `sync: false`, so Render asks for them instead of reading them from Git.

In Render, provide:

- `DATABASE_URL`: the pooled Neon connection string
- `JWT_SECRET`: a unique production secret of at least 32 characters
- `APP_ORIGINS`: the exact Vercel URL, with no trailing slash
- `ADMIN_EMAIL` and `ADMIN_PASSWORD`: the initial production admin credentials

Render supplies `PORT` automatically. Do not set it to a fixed value there.

Before using the live application, open a Render shell or another trusted terminal with the Neon variables and run `npm run db:migrate`. Run `npm run db:seed` only if the live demo needs the seed accounts and data.

### Vercel frontend

The committed `vercel.json` builds the Vite application and provides SPA route fallback. In Vercel, add this build-time environment variable:

```dotenv
VITE_API_URL=https://YOUR-RENDER-SERVICE.onrender.com
```

Deploy Vercel, copy its final URL into Render's `APP_ORIGINS`, and redeploy the Render service.

### pgAdmin

Register a second pgAdmin server using the host, database, role, and password from Neon. Use port `5432` and SSL mode `Require`. pgAdmin then manages the same database used by the Render API.
