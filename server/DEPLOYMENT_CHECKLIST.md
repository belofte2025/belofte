# Deployment Checklist

Use this checklist to ensure you don't miss any steps when deploying to DigitalOcean App Platform (no Docker needed).

## Pre-Deployment

- [ ] All code changes committed to Git
- [ ] Code pushed to GitHub/GitLab/Bitbucket
- [ ] `.env.example` is up to date with all required variables
- [ ] Database is accessible (Supabase URL is correct)
- [ ] Build works locally: `npm run build`
- [ ] Application starts locally: `npm start`

## DigitalOcean Setup

- [ ] DigitalOcean account created
- [ ] Payment method added
- [ ] Git repository is public or DigitalOcean has access

## App Platform Deployment

- [ ] App created in DigitalOcean
- [ ] Connected to Git repository
- [ ] Selected `server` directory as source
- [ ] Environment variables configured:
  - [ ] `PORT=10000`
  - [ ] `NODE_ENV=production`
  - [ ] `DATABASE_URL` (your Supabase URL)
  - [ ] `JWT_SECRET` (generate a secure one!)
  - [ ] `SWAGGER_SERVER_URL` (your app URL + /api)
- [ ] Build command set: `npm run build`
- [ ] Run command set: `npm start`
- [ ] HTTP port set to `10000`
- [ ] Resource size selected (Basic $5/mo recommended to start)

## Post-Deployment

- [ ] Check deployment logs for errors
- [ ] Verify migrations ran successfully
- [ ] Test API health endpoint: `https://your-app.ondigitalocean.app/api/health`
- [ ] Test a few key endpoints (login, data fetch, etc.)
- [ ] Seed database if needed (via Console: `npm run seed`)
- [ ] Update frontend API URL to point to production server
- [ ] Configure custom domain (optional)
- [ ] Set up monitoring/alerts (optional)

## Security Checklist

- [ ] JWT_SECRET is strong and unique
- [ ] .env file is NOT committed to Git
- [ ] Database credentials are secure
- [ ] CORS is properly configured for your frontend domain
- [ ] Rate limiting is enabled (if applicable)

## Troubleshooting Steps

If deployment fails:

1. **Check Logs**: View deployment logs in DigitalOcean dashboard
2. **Verify Environment Variables**: Ensure all required vars are set
3. **Database Connection**: Test DATABASE_URL is correct
4. **Build Issues**: Run `npm run build` locally to catch build errors
5. **Port Issues**: Ensure PORT=10000 is set
6. **Migrations**: Check if Prisma migrations ran successfully

## Useful Commands

```bash
# Generate secure JWT secret
openssl rand -base64 32

# Test database connection
npx prisma db pull

# View Prisma schema
npx prisma studio

# Manual migration
npx prisma migrate deploy
```

## Support

- DigitalOcean Docs: https://docs.digitalocean.com/products/app-platform/
- DigitalOcean Community: https://www.digitalocean.com/community/
- Prisma Docs: https://www.prisma.io/docs

---

**Next Step**: Follow the detailed instructions in [DEPLOYMENT_SIMPLE.md](./DEPLOYMENT_SIMPLE.md) for deploying without Docker.
