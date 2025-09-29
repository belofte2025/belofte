# Vercel Deployment Guide

This project is configured for deployment on Vercel with environment variable support.

## Prerequisites

1. A Vercel account
2. Your backend API deployed and accessible
3. Access to set environment variables in Vercel dashboard

## Deployment Steps

### 1. Connect to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub/GitLab repository
4. Vercel will automatically detect this as a Next.js project

### 2. Configure Environment Variables

In the Vercel dashboard, add the following environment variables:

**Required Environment Variables:**
- `NEXT_PUBLIC_API_BASE_URL`: Your backend API URL (e.g., `https://your-backend.com/api`)

**Optional Environment Variables:**
- `NODE_ENV`: Set to `production` (usually set automatically by Vercel)

### 3. Deploy

1. Click "Deploy" in Vercel
2. Vercel will build and deploy your application
3. Your app will be available at the provided URL

## Environment Configuration

### Development
- Copy `.env.example` to `.env.local` in the `client` directory
- Update `NEXT_PUBLIC_API_BASE_URL` with your development backend URL

### Production (Vercel)
- Set environment variables in Vercel dashboard
- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
- Other variables are only available server-side

## Project Structure

```
belofte-enterprise/
├── client/                 # Next.js frontend (deployed to Vercel)
│   ├── .env.local         # Development environment variables
│   ├── .env.example       # Environment variables template
│   ├── vercel.json        # Vercel client configuration (minimal)
│   └── ...
├── server/                # Express.js backend (deploy separately)
│   ├── vercel.json        # Server functions configuration
│   └── ...
└── package.json           # Root package.json
```

## Troubleshooting

### Build Failures
- Check that all environment variables are set in Vercel dashboard
- Ensure `NEXT_PUBLIC_API_BASE_URL` is properly configured
- Check build logs in Vercel dashboard

### API Connection Issues
- Verify `NEXT_PUBLIC_API_BASE_URL` is correct
- Ensure your backend is deployed and accessible
- Check CORS settings on your backend

### Environment Variables Not Working
- Ensure environment variables in Vercel start with `NEXT_PUBLIC_` for client-side access
- Redeploy after changing environment variables
- Check that variables are not cached by clearing browser cache

## Backend Deployment

Note: This guide covers frontend deployment only. Your Express.js backend in the `server/` directory needs to be deployed separately (e.g., on Railway, Render, or Heroku).

## Local Development

### Environment Configuration
**Client (.env.local):**
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
NODE_ENV=development
```

**Server (.env):**
```
PORT=4000
NODE_ENV=development
DATABASE_URL="your_database_connection_string_here"
JWT_SECRET="your_jwt_secret_here"
SWAGGER_SERVER_URL="http://localhost:4000/api"
```

### Development Commands
```bash
# Install dependencies
npm run install:all

# Start both client and server in development
npm run dev
# This runs:
# - Server: http://localhost:4000 (API at /api/*)
# - Client: http://localhost:3000 (connects to localhost:4000/api)

# Or start individually:
npm run dev:server  # Server only
npm run dev:client  # Client only

# Build for production
npm run build
```

### Development vs Production URLs
- **Local Development**: Client → `http://localhost:4000/api`
- **Production**: Client → `https://your-deployed-backend.com/api`
