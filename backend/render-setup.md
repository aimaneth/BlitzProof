# Render Backend Setup (Free)

## 1. Create Render Account
- Go to https://render.com
- Sign up with GitHub (free)
- Verify your email

## 2. Deploy Backend Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `blitzproof-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

## 3. Environment Variables
Add these in Render dashboard:
```
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://postgres:[SUPABASE_PASSWORD]@db.[SUPABASE_PROJECT_REF].supabase.co:5432/postgres
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=https://your-frontend-url.vercel.app
REDIS_URL=redis://localhost:6379
```

## 4. Free Tier Limits
- 750 hours/month (31 days)
- Sleeps after 15 minutes of inactivity
- 512MB RAM
- Shared CPU
- Automatic HTTPS
- Custom domains

## 5. Health Check
- Render will automatically check `/health` endpoint
- Service will restart if health check fails
- Monitor logs in Render dashboard

## 6. Auto-Deploy
- Automatic deployments on git push
- Manual deployments available
- Rollback to previous versions

## 7. Monitoring
- Built-in logs viewer
- Performance metrics
- Error tracking
- Uptime monitoring 