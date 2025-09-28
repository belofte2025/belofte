# Development Setup Verification

## ✅ Current Configuration

After the recent updates, your development environment is now properly configured:

### **Client Configuration** (`client/.env.local`)
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
NODE_ENV=development
```

### **Server Configuration** (`server/.env`)
```
PORT=4000
NODE_ENV=development
DATABASE_URL="your_database_connection_string_here"
JWT_SECRET="your_jwt_secret_here"
SWAGGER_SERVER_URL="http://localhost:4000/api"
```

## 🚀 How to Run Development

### Step 1: Start Both Services
```bash
npm run dev
```

This command will start:
- **Backend Server**: `http://localhost:4000` (API endpoints at `/api/*`)
- **Frontend Client**: `http://localhost:3000` (Next.js dev server)

### Step 2: Verify Communication
1. Open `http://localhost:3000` in your browser (frontend)
2. The frontend will make API calls to `http://localhost:4000/api`
3. Check browser Network tab to see API requests going to localhost:4000

### Step 3: API Documentation
- Swagger UI available at: `http://localhost:4000/api-docs`

## 🔧 Troubleshooting

### If Client Can't Connect to Server:
1. **Check if both servers are running**:
   ```bash
   # Should show both processes
   netstat -an | findstr ":3000"  # Client
   netstat -an | findstr ":4000"  # Server
   ```

2. **Check environment variables**:
   ```bash
   # In client directory
   cd client
   Get-Content .env.local
   ```

3. **Check CORS settings** in server:
   - Server is configured with `origin: "*"` which allows all origins
   - This includes localhost:3000

### Common Issues:
- **Port conflicts**: Make sure ports 3000 and 4000 are available
- **Environment file not loaded**: Restart dev servers after changing .env files
- **Database connection**: Update `DATABASE_URL` in server/.env with your actual database

## 📊 Environment Switching

| Environment | Client connects to | Usage |
|-------------|-------------------|--------|
| **Development** | `http://localhost:4000/api` | Local development |
| **Production** | `https://offloadbackend.onrender.com/api` | Deployed on Vercel |

To switch environments, just change `NEXT_PUBLIC_API_BASE_URL` in the appropriate `.env` file.