# BuzinAvto Deployment Guide

This repository contains the buyer-facing frontend and the supporting backend services used by the Japan catalog, calculator, and stats pages.

## Project Layout

- `b-nextjs-frontent-main` - Next.js frontend running on port `3000`
- `buzinavt-nestjs-backend` - main NestJS backend
- `buzinavt-nestjs-backend/CalculationModule/buzin_calculator` - standalone FastAPI calculator/search service running on port `8000`

For the Japan pages delivered in this project, the critical runtime pair is:

1. `b-nextjs-frontent-main`
2. `buzinavt-nestjs-backend/CalculationModule/buzin_calculator`

The frontend talks to the calculator/search service through `API_URL` on the server side and `/api/backend/*` in the browser.

## Requirements

- Node.js `20.9+` or `22.x`
- `pnpm` `9+`
- Python `3.11+` or `3.12`
- MongoDB for the Next.js/Payload app
- Optional: Redis + MongoDB for the NestJS backend if you want to run it too

## 1. Frontend Setup

Working directory:

```powershell
cd C:\Users\Anek\BuzinAvto\b-nextjs-frontent-main
```

Install dependencies:

```powershell
pnpm install
```

Create `.env` from `.env.example` and fill at least these values:

```env
DATABASE_URI=mongodb://127.0.0.1:27017/buzinavto_front
PAYLOAD_SECRET=change_me
PAYLOAD_URL=http://localhost:3000
API_URL=http://127.0.0.1:8000/api/v1
```

Notes:

- `PAYLOAD_URL` must match the public frontend URL in production.
- `API_URL` must point to the FastAPI calculator/search service, not to the browser proxy path.

Run locally:

```powershell
pnpm dev
```

Production build:

```powershell
pnpm build
pnpm start
```

Frontend will be available on:

```text
http://localhost:3000
```

## 2. FastAPI Calculator/Search Service

Working directory:

```powershell
cd C:\Users\Anek\BuzinAvto\buzinavt-nestjs-backend\CalculationModule\buzin_calculator
```

Create and activate a virtual environment:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

Optional environment variables:

```env
ALEADO_USERNAME=your_aleado_login
ALEADO_PASSWORD=your_aleado_password
```

Run the service:

```powershell
uvicorn main:app --host 0.0.0.0 --port 8000
```

FastAPI will be available on:

```text
http://localhost:8000
```

Key endpoints:

- `GET /api/v1/search`
- `GET /api/v1/auction/filters`
- `GET /api/v1/auction/stats`
- `POST /api/v1/calculate`

## 3. Optional NestJS Backend

If you need the original NestJS service too:

```powershell
cd C:\Users\Anek\BuzinAvto\buzinavt-nestjs-backend
npm install
```

Create `.env` from `.env.example` and provide the required variables from `src/app/configurations/env-validate.config.ts`, then run:

```powershell
npm run start:dev
```

This service is not required for the standalone Japan calculator/frontend handoff if the FastAPI module is being used directly.

## 4. Production Deployment

Minimum production sequence:

1. Start MongoDB.
2. Start FastAPI on `8000`.
3. Set frontend `API_URL` to the FastAPI public base, for example:

```env
API_URL=https://your-domain.com/api/v1
PAYLOAD_URL=https://your-frontend-domain.com
```

4. Build and start the frontend on `3000`.
5. Put a reverse proxy in front of the frontend.

Example Nginx config for the frontend:

```nginx
server {
    listen 80;
    server_name your-frontend-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Important:

- Restart the frontend after every `API_URL` or `PAYLOAD_URL` change.
- The browser must access the frontend origin only; API calls are proxied by Next.js through `/api/backend/*`.

## 5. Verification Checklist

After startup, verify:

1. Frontend opens at `/japan/`
2. Catalog search returns lots
3. Calculator returns totals
4. Stats pages load for brand and brand/model routes

Quick manual checks:

```text
http://localhost:3000/japan/
http://localhost:3000/japan/cars/
http://localhost:3000/japan/calculator/
http://localhost:3000/japan/stats/
```

## 6. Handoff Notes

- The frontend README bundled from the original template was outdated; use this root guide for deployment.
- The FastAPI calculator is self-contained and does not require runtime calls to TKS.
- Catalog cards now show a single final total price based on the current calculator logic.
