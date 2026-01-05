# Simple Deployment to DigitalOcean (No Docker)

This guide shows how to deploy your server to DigitalOcean App Platform without Docker.

## Prerequisites

- DigitalOcean account ([Sign up here](https://cloud.digitalocean.com/))
- GitHub/GitLab/Bitbucket account
- Your code pushed to a Git repository

## Important: Remove Dockerfile

DigitalOcean App Platform works best with its native Node.js buildpack (no Docker needed). The Dockerfile has been renamed to `Dockerfile.backup`. If you have a Dockerfile in your repo, either:
- Delete it, or
- Rename it to `Dockerfile.backup`

This ensures App Platform uses the correct build process that handles TypeScript and dev dependencies properly.

## Step-by-Step Deployment

### Step 1: Push Your Code to Git

```bash
# Navigate to your server directory
cd server

# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Ready for deployment"

# Add your remote repository (replace with your URL)
git remote add origin https://github.com/yourusername/your-repo.git

# Push
git push -u origin main
```

### Step 2: Create App on DigitalOcean

1. Go to [DigitalOcean Dashboard](https://cloud.digitalocean.com/)
2. Click **Create** → **Apps**
3. Choose **GitHub** (or your Git provider)
4. Click **Manage Access** and authorize DigitalOcean
5. Select your repository from the dropdown
6. Select the branch: `main`
7. **Important**: Set **Source Directory** to `server` (or wherever your server code is)
8. Click **Next**

### Step 3: Configure Resources

DigitalOcean will auto-detect your Node.js app. Review these settings:

**App Name**: Choose a name (e.g., `belofteent-api`)

**Resource Type**: Web Service (should be auto-selected)

**Build Command**:
```
npm run build
```

**Run Command**:
```
npm start
```

**HTTP Port**: `10000`

**Environment Variables** - Click "Edit" and add:

| Key | Value |
|-----|-------|
| `PORT` | `10000` |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Your Supabase PostgreSQL URL |
| `JWT_SECRET` | Generate a secure secret (see below) |
| `SWAGGER_SERVER_URL` | `https://your-app-name.ondigitalocean.app/api` |

**Generate JWT_SECRET** (run this locally):
```bash
# Windows PowerShell
$bytes = [byte[]]::new(32)
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[Convert]::ToBase64String($bytes)

# Mac/Linux
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output and use it as your `JWT_SECRET`.

### Step 4: Choose Plan

**Recommended for starting**:
- **Basic** plan: $5/month (512 MB RAM, 1 vCPU)
- Can scale up later if needed

Click **Next**

### Step 5: Review and Launch

1. Review all settings
2. Click **Create Resources**
3. Wait for deployment (5-10 minutes)

### Step 6: Verify Deployment

Once deployed, you'll get a URL like: `https://your-app-name.ondigitalocean.app`

**Test your API**:
1. Open: `https://your-app-name.ondigitalocean.app/api`
2. You should see your API response or Swagger docs

**Check the logs**:
1. Go to your app in DigitalOcean dashboard
2. Click on your component
3. Click **Runtime Logs** tab
4. Look for:
   - ✅ "Server running on port 10000"
   - ✅ Prisma migrations completed
   - ❌ No error messages

### Step 7: Seed Database (Optional)

If you need to seed your database:

1. In DigitalOcean dashboard, go to your app
2. Click **Console** tab
3. Run:
```bash
npm run seed
```

---

## Updating Your App

When you make changes:

```bash
# Commit your changes
git add .
git commit -m "Your changes"

# Push to Git
git push

# DigitalOcean will automatically rebuild and redeploy!
```

Auto-deployment happens on every push to `main` branch.

---

## Common Issues & Solutions

### Issue: Build Fails

**Check**:
- View build logs in DigitalOcean dashboard
- Ensure `package.json` has correct scripts
- Verify all dependencies are in `package.json` (not just `devDependencies`)

**Solution**:
```bash
# Test build locally first
npm run build

# If it works locally but fails in DO, check Node version
# You can specify Node version in package.json:
{
  "engines": {
    "node": "18.x"
  }
}
```

### Issue: App Crashes on Start

**Check logs for**:
- Database connection errors → Verify `DATABASE_URL`
- Port binding errors → Ensure `PORT=10000` is set
- Missing environment variables → Add them in settings

### Issue: Database Migrations Fail

**Solution**:
1. Check if `DATABASE_URL` is correct
2. Ensure database is accessible from DigitalOcean
3. Run migrations manually via Console:
```bash
npx prisma migrate deploy
```

### Issue: Can't Access Environment Variables

**Verify**:
1. Environment variables are set in App Settings
2. No typos in variable names
3. App was restarted after adding variables

---

## Environment Variables Reference

Make sure ALL these are set:

```env
PORT=10000
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your_generated_secure_secret_here
SWAGGER_SERVER_URL=https://your-app-name.ondigitalocean.app/api
```

---

## Custom Domain (Optional)

To use your own domain:

1. In DigitalOcean dashboard, go to your app
2. Click **Settings** tab
3. Scroll to **Domains**
4. Click **Add Domain**
5. Enter your domain name
6. Follow DNS instructions to point your domain to DigitalOcean

---

## Monitoring

**View Logs**:
- Dashboard → Your App → Runtime Logs

**View Metrics**:
- Dashboard → Your App → Insights
- Shows CPU, Memory, HTTP requests

**Set Alerts**:
- Dashboard → Your App → Alerts
- Get notified if app goes down

---

## Costs

**App Platform**:
- Basic: $5/month (512 MB RAM)
- Professional: $12/month (1 GB RAM)

**Database**:
- You're using Supabase (separate billing)
- Free tier available

**Bandwidth**:
- 40 GB free per month
- $0.01/GB after

---

## Next Steps

1. ✅ Deploy your app
2. ✅ Test all endpoints
3. ✅ Update your frontend to use the production API URL
4. ✅ Monitor logs for any issues
5. ⬜ Set up custom domain (optional)
6. ⬜ Configure auto-scaling (optional)

---

## Support

- **DigitalOcean Docs**: https://docs.digitalocean.com/products/app-platform/
- **Community**: https://www.digitalocean.com/community/
- **Support Tickets**: Available in dashboard

---

**Quick Checklist**:
- [ ] Code pushed to Git
- [ ] App created on DigitalOcean
- [ ] Source directory set to `server`
- [ ] Environment variables configured
- [ ] Build & run commands correct
- [ ] App deployed successfully
- [ ] Database migrations ran
- [ ] API endpoints tested
