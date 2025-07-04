# 🚀 Backend Deployment Checklist

## Pre-Deployment Setup

### ✅ Environment Variables
- [ ] Set `DATABASE_URL` (PostgreSQL connection string)
- [ ] Set `REDIS_URL` (Redis connection string)
- [ ] Set `JWT_SECRET` (strong secret key)
- [ ] Set `FRONTEND_URL` (your frontend domain)
- [ ] Set blockchain explorer API keys:
  - [ ] `ETHERSCAN_API_KEY`
  - [ ] `POLYGONSCAN_API_KEY`
  - [ ] `BSCSCAN_API_KEY`
  - [ ] `ARBISCAN_API_KEY`
  - [ ] `OPTIMISM_API_KEY`

### ✅ Database Setup
- [ ] PostgreSQL database created
- [ ] Database migrations will run automatically on startup
- [ ] Database connection tested

### ✅ Redis Setup
- [ ] Redis instance created
- [ ] Redis connection tested
- [ ] Redis URL configured

## Deployment Platforms

### Render.com
- [ ] Connect GitHub repository
- [ ] Set environment variables in Render dashboard
- [ ] Deploy using `render.yaml` configuration
- [ ] Verify health check endpoint: `https://your-app.onrender.com/health`

### Railway
- [ ] Connect GitHub repository
- [ ] Set environment variables
- [ ] Deploy using Railway CLI or dashboard
- [ ] Verify deployment

### Heroku
- [ ] Create Heroku app
- [ ] Set environment variables
- [ ] Deploy using Heroku CLI
- [ ] Verify deployment

### VPS/Server
- [ ] Install Node.js 18+
- [ ] Install PM2: `npm install -g pm2`
- [ ] Clone repository
- [ ] Set environment variables
- [ ] Run: `npm ci --only=production`
- [ ] Run: `npm run build`
- [ ] Run: `npm run migrate`
- [ ] Start with PM2: `pm2 start ecosystem.config.js --env production`

## Post-Deployment Verification

### ✅ Health Checks
- [ ] Health endpoint: `GET /health`
- [ ] Database connection
- [ ] Redis connection
- [ ] All services responding

### ✅ API Endpoints
- [ ] Authentication: `POST /api/auth/register`
- [ ] Scanning: `POST /api/scan`
- [ ] Profile: `GET /api/profile`
- [ ] Export: `GET /api/export`

### ✅ Frontend Integration
- [ ] CORS configured correctly
- [ ] Frontend can connect to backend
- [ ] WebSocket connections working
- [ ] File uploads working

### ✅ Monitoring
- [ ] Logs accessible
- [ ] Error tracking setup
- [ ] Performance monitoring
- [ ] Uptime monitoring

## Troubleshooting

### Common Issues
1. **Database connection failed**
   - Check `DATABASE_URL` format
   - Verify database is accessible
   - Check firewall settings

2. **Redis connection failed**
   - Check `REDIS_URL` format
   - Verify Redis instance is running
   - Check network connectivity

3. **CORS errors**
   - Verify `FRONTEND_URL` is set correctly
   - Check CORS configuration in `src/index.ts`
   - Ensure frontend domain is in allowed origins

4. **Build failures**
   - Check TypeScript compilation
   - Verify all dependencies are installed
   - Check Node.js version (requires 18+)

5. **API key errors**
   - Verify all blockchain explorer API keys are set
   - Check API key permissions
   - Test API keys individually

## Environment Variables Reference

```bash
# Required
DATABASE_URL=postgresql://user:pass@host:5432/dbname
REDIS_URL=redis://host:6379
JWT_SECRET=your-super-secret-key
FRONTEND_URL=https://your-frontend-domain.com

# Blockchain APIs (at least one required)
ETHERSCAN_API_KEY=your-etherscan-key
POLYGONSCAN_API_KEY=your-polygonscan-key
BSCSCAN_API_KEY=your-bscscan-key
ARBISCAN_API_KEY=your-arbiscan-key
OPTIMISM_API_KEY=your-optimism-key

# Optional
NODE_ENV=production
PORT=4000
LOG_LEVEL=warn
```

## Support

If you encounter issues:
1. Check the logs: `pm2 logs blitzproof-backend`
2. Verify environment variables
3. Test database and Redis connections
4. Check the health endpoint
5. Review the deployment documentation 