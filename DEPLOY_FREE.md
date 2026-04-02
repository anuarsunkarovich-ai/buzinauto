# Free Deployment Guide

This repo is now set up for the cheapest practical hosting combination:

- Vercel for `b-nextjs-frontent-main`
- Render for `buzinavt-nestjs-backend/CalculationModule/buzin_calculator`
- MongoDB Atlas for the Payload database
- Optional: Supabase Storage for Payload uploads through its S3-compatible API

## Why MongoDB Stays

The frontend cannot be switched to Supabase Postgres with only environment-variable changes.
It uses Payload on MongoDB and also performs direct Mongo-style aggregation against `payload.db.collections['catalog-car']`.

That means a real move to Supabase database storage would require:

1. Replacing the Payload Mongo adapter with the Postgres adapter.
2. Rewriting Mongo aggregation routes.
3. Migrating existing data and query behavior.

For a free deployment today, keep MongoDB Atlas and optionally use Supabase only for file storage.

## 1. MongoDB Atlas

Create a free Atlas cluster and a database user.

Use a connection string like:

```env
DATABASE_URI=mongodb+srv://username:password@cluster.mongodb.net/buzinavto_front?retryWrites=true&w=majority
```

Recommended database name for the frontend:

- `buzinavto_front`

## 2. Render Python API

The repo root now includes a [`render.yaml`](./render.yaml) blueprint for the calculator API.

Service path:

- `buzinavt-nestjs-backend/CalculationModule/buzin_calculator`

Important environment variables:

```env
FRONTEND_URL=https://your-project.vercel.app
ALLOWED_ORIGINS=https://your-project.vercel.app
ALLOW_ORIGIN_REGEX=https://.*\.vercel\.app
ALEADO_USERNAME=
ALEADO_PASSWORD=
```

The service exposes:

- `/health`
- `/api/v1/search`
- `/api/v1/auction/filters`
- `/api/v1/auction/stats`
- `/api/v1/calculate`

## 3. Vercel Frontend

Create a Vercel project with the root directory set to:

- `b-nextjs-frontent-main`

Set these environment variables in Vercel:

```env
DATABASE_URI=mongodb+srv://username:password@cluster.mongodb.net/buzinavto_front?retryWrites=true&w=majority
PAYLOAD_SECRET=replace_with_a_long_random_secret
PAYLOAD_URL=https://your-project.vercel.app
NEXT_PUBLIC_SITE_URL=https://your-project.vercel.app
API_URL=https://your-render-service.onrender.com/api/v1
```

Notes:

- `API_URL` is the server-side upstream used by the Next.js proxy route.
- `NEXT_PUBLIC_API_URL` is optional. Leave it empty unless you intentionally want the browser to call Render directly.
- `PAYLOAD_URL` is used for sitemap, metadata, and Payload server URL resolution.

## 4. Optional Supabase Storage for Uploads

Vercel does not provide durable local disk storage for uploaded files.
This repo now supports external S3-compatible storage for the Payload media collection.

Supabase Storage can be used here through its S3-compatible credentials.

Set these Vercel environment variables if you want upload persistence:

```env
S3_BUCKET=your-bucket
S3_REGION=your-region
S3_ACCESS_KEY_ID=your-s3-access-key
S3_SECRET_ACCESS_KEY=your-s3-secret
S3_ENDPOINT=https://your-project-id.storage.supabase.co/storage/v1/s3
S3_FORCE_PATH_STYLE=false
UPLOADS_PUBLIC_URL=https://your-project-id.supabase.co/storage/v1/object/public/your-bucket
```

When these variables are present, the frontend automatically switches the `auction-media` collection away from local disk storage.

## 5. Admin and Seed Data

This repo includes [`create-admin.ts`](./b-nextjs-frontent-main/create-admin.ts) as a starting point for creating the first admin user.

If you prefer not to script it yet, create the first admin user through the Payload admin flow after the first successful deploy.

If you do script it, make sure it points at the same `DATABASE_URI` you use in production.

## 6. Recommended Free Stack Summary

- Database: MongoDB Atlas free tier
- File storage: Supabase Storage free tier
- Frontend + Payload app: Vercel
- Calculator/search API: Render free web service

That gives you a workable free deployment without rewriting the data layer.
