# Deployment Environment Variables

These environment variables must be set in your deployment platform settings (DigitalOcean App Platform, Vercel, etc.).

## Required Environment Variables

### Database URLs
```
DATABASE_URL="postgresql://postgres.mykjvleuxquasmhnbxkl:sV4lnmLW7FvfqHnipKiUMBtUqnUV0jSC@aws-0-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

```
DIRECT_URL="postgresql://postgres.mykjvleuxquasmhnbxkl:sV4lnmLW7FvfqHnipKiUMBtUqnUV0jSC@aws-0-eu-west-2.pooler.supabase.com:5432/postgres"
```

**IMPORTANT:**
- `DATABASE_URL` uses port **6543** (PgBouncer pooling) - used for application queries
- `DIRECT_URL` uses port **5432** (direct connection) - used for migrations

### JWT & CORS
```
JWT_SECRET="your_jwt_secret_here"
```

```
CORS_ORIGIN="https://petros-ivory.vercel.app,http://localhost:3000"
```

### Server Configuration
```
PORT="10000"
NODE_ENV="production"
```

### API Documentation
```
SWAGGER_SERVER_URL="https://your-server.vercel.app/api"
```
(Replace with your actual Vercel server URL)

### SMS Configuration (Nalo Solutions)
```
SMS_PROVIDER="nalo"
SMS_API_URL="https://sms.nalosolutions.com/smsbackend/Resl_Nalo/send-message/"
SMS_USERNAME="Eyosolutions"
SMS_PASSWORD="Year@1989"
SMS_SENDER_ID="BELOFTE"
SMS_API_KEY="gcA_Qa6OSnoHmU3Fne8-DrnJytUK9JexgxrLHoHUtqSW19i4D_Ab_6eG4cSBQ1NJ"
```

## How to Set Environment Variables

### DigitalOcean App Platform

1. Go to your app in DigitalOcean dashboard
2. Click on **Settings** tab
3. Scroll to **App-Level Environment Variables**
4. Click **Edit**
5. Add each variable:
   - Enter the variable name (e.g., `DATABASE_URL`)
   - Enter the value
   - Click **Save**
6. Redeploy your app for changes to take effect

### Vercel (if deploying there)

1. Go to your Vercel project dashboard
2. Click on **Settings** tab
3. Select **Environment Variables** from the left sidebar
4. Add each variable:
   - Enter the variable name (e.g., `DATABASE_URL`)
   - Enter the value
   - Select environment: **Production**, **Preview**, and **Development**
   - Click **Save**

## Multiple Deployments with Different Databases

You can deploy the same Git repository to multiple DigitalOcean apps, each with different database credentials:

**Example:**
- **App 1** → Database A: Set `DATABASE_URL` and `DIRECT_URL` for Database A
- **App 2** → Database B: Set `DATABASE_URL` and `DIRECT_URL` for Database B

Each app maintains its own environment variables independently.

## Why DIRECT_URL is Required

Prisma migrations cannot run through PgBouncer (pooled connection) because:
- PgBouncer doesn't support prepared statements used by migrations
- The error "prepared statement 's1' already exists" occurs when using pooled connection

The start script now uses `DIRECT_URL` for migrations:
```bash
DATABASE_URL="$DIRECT_URL" npx prisma migrate deploy && node dist/index.js
```

This ensures migrations run on the direct connection while the application uses the pooled connection for better performance.
