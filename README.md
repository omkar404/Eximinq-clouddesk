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
