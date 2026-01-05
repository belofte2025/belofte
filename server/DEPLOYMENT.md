# Server Deployment Guide - DigitalOcean

This guide will help you deploy the server to DigitalOcean using App Platform.

## Prerequisites

- DigitalOcean account
- Git repository (GitHub, GitLab, or Bitbucket)
- Database URL (you're already using Supabase)

## Deployment Options

### Option 1: DigitalOcean App Platform (Recommended - Easiest)

App Platform is a Platform-as-a-Service (PaaS) that automatically builds and deploys your application.

#### Step 1: Push Code to Git Repository

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Prepare for deployment"

# Add remote repository (replace with your repo URL)
git remote add origin https://github.com/yourusername/your-repo.git

# Push to main branch
git push -u origin main
```

#### Step 2: Create App on DigitalOcean

1. Log in to [DigitalOcean](https://cloud.digitalocean.com/)
2. Click **Create** > **Apps**
3. Connect your Git repository:
   - Choose your Git provider (GitHub/GitLab/Bitbucket)
   - Authorize DigitalOcean to access your repositories
   - Select your repository and branch (usually `main`)
   - **Important**: Select the `server` directory as the source directory

#### Step 3: Configure App Settings

1. **Environment Variables**: Add the following environment variables:
   ```
   PORT=10000
   NODE_ENV=production
   DATABASE_URL=postgresql://postgres.ttjzkuhdezrjztnirits:Year2025belofte@aws-1-eu-north-1.pooler.supabase.com:5432/postgres
   JWT_SECRET=your_secure_jwt_secret_here
   SWAGGER_SERVER_URL=https://your-app-name.ondigitalocean.app/api
   ```

2. **Build Command** (if not auto-detected):
   ```
   npm run build
   ```

3. **Run Command** (if not auto-detected):
   ```
   npm start
   ```

4. **HTTP Port**: `10000`

5. **Resource Size**:
   - Start with **Basic** ($5/month)
   - Can scale up later if needed

#### Step 4: Deploy

1. Click **Next** through the configuration
2. Review your settings
3. Click **Create Resources**
4. Wait for deployment (usually 5-10 minutes)

#### Step 5: Post-Deployment

1. **Database Migrations**:
   - The `npm start` script automatically runs `prisma migrate deploy`
   - Check logs to ensure migrations succeeded

2. **Seed Database** (if needed):
   - Go to Console tab in your app
   - Run: `npm run seed`

3. **Test Your API**:
   - Your app URL: `https://your-app-name.ondigitalocean.app`
   - Test health endpoint: `https://your-app-name.ondigitalocean.app/api/health`

---

### Option 2: DigitalOcean Droplet (VPS)

For more control over your server configuration.

#### Step 1: Create a Droplet

1. Create a new Droplet:
   - **Image**: Ubuntu 22.04 LTS
   - **Size**: Basic ($6/month or higher)
   - **Datacenter**: Choose closest to your users
   - **Authentication**: SSH key (recommended) or password

#### Step 2: Initial Server Setup

```bash
# SSH into your droplet
ssh root@your_droplet_ip

# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Install PM2 (process manager)
npm install -g pm2

# Install Nginx
apt install -y nginx

# Install Git
apt install -y git
```

#### Step 3: Deploy Application

```bash
# Create app directory
mkdir -p /var/www
cd /var/www

# Clone your repository
git clone https://github.com/yourusername/your-repo.git app
cd app/server

# Install dependencies
npm ci

# Create .env file
nano .env
# Add your environment variables (see .env.example)

# Build application
npm run build

# Run migrations
npx prisma migrate deploy

# Seed database (optional)
npm run seed

# Start with PM2
pm2 start dist/index.js --name "belofteent-api"
pm2 save
pm2 startup
```

#### Step 4: Configure Nginx

```bash
# Create Nginx configuration
nano /etc/nginx/sites-available/api
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain

    location / {
        proxy_pass http://localhost:10000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/api /etc/nginx/sites-enabled/

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx
```

#### Step 5: Setup SSL with Let's Encrypt

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
```

#### Step 6: Configure Firewall

```bash
# Allow SSH, HTTP, and HTTPS
ufw allow ssh
ufw allow http
ufw allow https
ufw enable
```

---

## Environment Variables

Make sure to set these environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `10000` |
| `NODE_ENV` | Environment | `production` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:password@host:5432/db` |
| `JWT_SECRET` | Secret for JWT tokens | Generate a strong random string |
| `SWAGGER_SERVER_URL` | API base URL for Swagger docs | `https://your-domain.com/api` |

### Generating a Secure JWT Secret

```bash
# Linux/Mac
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Monitoring & Maintenance

### App Platform

- **Logs**: View in DigitalOcean dashboard under your app
- **Metrics**: CPU, Memory, and Request metrics available
- **Auto-scaling**: Configure in app settings

### Droplet with PM2

```bash
# View logs
pm2 logs

# Monitor processes
pm2 monit

# Restart app
pm2 restart belofteent-api

# Update application
cd /var/www/app/server
git pull
npm ci
npm run build
npx prisma migrate deploy
pm2 restart belofteent-api
```

---

## Troubleshooting

### Check if app is running
```bash
# App Platform: Check logs in dashboard
# Droplet: pm2 status
```

### Database connection issues
```bash
# Test database connection
npx prisma db pull
```

### Port already in use
```bash
# Find what's using port 10000
lsof -i :10000
# or
netstat -tlnp | grep 10000
```

---

## Cost Estimates

### App Platform
- **Basic**: $5/month (512 MB RAM, 1 vCPU)
- **Professional**: $12/month (1 GB RAM, 1 vCPU)

### Droplet
- **Basic**: $6/month (1 GB RAM, 1 vCPU, 25 GB SSD)
- **Regular**: $12/month (2 GB RAM, 1 vCPU, 50 GB SSD)

### Database
You're already using Supabase (free tier available).

---

## Next Steps

1. Choose your deployment method (App Platform recommended for beginners)
2. Set up environment variables
3. Deploy your application
4. Test all endpoints
5. Configure custom domain (optional)
6. Set up monitoring and alerts

For issues or questions, check DigitalOcean's documentation or community forums.
