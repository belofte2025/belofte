# Belofte Enterprise - Unified Frontend & Backend

This project combines a Next.js frontend with an Express.js backend into a single deployable application. The Express server serves both the API endpoints and the static Next.js files.

## Project Structure

```
belofteEnt/
├── client/          # Next.js frontend application
│   ├── app/         # Next.js 13+ app directory
│   ├── components/  # React components
│   ├── public/      # Static assets
│   └── ...
├── server/          # Express.js backend application
│   ├── src/         # TypeScript source code
│   ├── prisma/      # Database schema and migrations
│   ├── dist/        # Compiled JavaScript (after build)
│   └── ...
└── package.json     # Root package.json for unified scripts
```

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm
- PostgreSQL (if using Prisma with PostgreSQL)

### Installation

1. Install all dependencies for both client and server:
   ```bash
   npm run install:all
   ```

### Environment Setup

1. Copy the example environment file:
   ```bash
   cp server/.env.example server/.env
   ```

2. Update the `.env` file with your actual values:
   - Database connection string
   - JWT secret
   - Other required environment variables

### Development

To run both frontend and backend in development mode simultaneously:
```bash
npm run dev
```

This will start:
- Next.js dev server on `http://localhost:3000`
- Express API server on `http://localhost:4000`

To run them separately:
```bash
npm run dev:client  # Start only the Next.js frontend
npm run dev:server  # Start only the Express backend
```

### Production Build & Deployment

1. Build both frontend and backend:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

The Express server will serve both the API (at `/api/*` routes) and the Next.js static files for all other routes.

### Available Scripts

- `npm run dev` - Run both client and server in development mode
- `npm run dev:client` - Run only the Next.js frontend
- `npm run dev:server` - Run only the Express backend
- `npm run build` - Build both client and server for production
- `npm run build:client` - Build only the Next.js frontend
- `npm run build:server` - Build only the Express backend
- `npm start` - Start the production server
- `npm run install:all` - Install dependencies for root, client, and server
- `npm run clean` - Clean build artifacts

## API Documentation

When running the server, Swagger documentation is available at:
- Development: `http://localhost:4000/api-docs`
- Production: `http://your-domain.com/api-docs`

## Deployment Notes

- The production server runs on the port specified in `PORT` environment variable (default: 4000)
- All API routes are prefixed with `/api`
- The Express server handles client-side routing by serving `index.html` for non-API routes
- Make sure to set appropriate CORS origins in production