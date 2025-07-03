# 🚀 Deployment Environment Setup Guide

## Overview

This guide explains how to set up environment variables for deploying BlitzProof Security Scanner to production.

## 📁 Environment Files Structure

```
├── frontend/
│   ├── .env.local          # Development (gitignored)
│   ├── .env.example        # Template (committed to git)
│   └── .env.production     # Production template (gitignored)
├── backend/
│   ├── .env                # Development (gitignored)
│   ├── .env.example        # Template (committed to git)
│   └── .env.production     # Production template (gitignored)
└── DEPLOYMENT_ENV_SETUP.md # This guide
```

## 🔧 Frontend Environment Variables

### Required Variables

```bash
# WalletConnect Configuration
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id

# API Configuration
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
NEXT_PUBLIC_FRONTEND_URL=https://your-frontend-domain.com

# Application Configuration
NEXT_PUBLIC_APP_NAME=BlitzProof Security Scanner
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_APP_ENVIRONMENT=production
```

### Optional Variables

```bash
# Analytics and Monitoring
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=your-ga-id
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_DEBUG_MODE=false
NEXT_PUBLIC_ENABLE_TUTORIAL=false

# WebSocket Configuration
NEXT_PUBLIC_WS_URL=wss://your-backend-domain.com

# File Upload Configuration
NEXT_PUBLIC_MAX_FILE_SIZE=10485760
NEXT_PUBLIC_SUPPORTED_NETWORKS=ethereum,polygon,arbitrum,optimism,bsc,avalanche,fantom,base
```

## 🔧 Backend Environment Variables

### Required Variables

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@your-db-host:5432/blitzproof_prod
REDIS_URL=redis://your-redis-host:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=4000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com

# CORS Configuration
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com
```

### Critical API Keys (Required for Full Functionality)

```bash
# Blockchain Explorer API Keys
ETHERSCAN_API_KEY=your-etherscan-api-key
POLYGONSCAN_API_KEY=your-polygonscan-api-key
BSCSCAN_API_KEY=your-bscscan-api-key
ARBISCAN_API_KEY=your-arbiscan-api-key
OPTIMISM_API_KEY=your-optimism-api-key
```

### Optional Variables

```bash
# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Security Tool Configuration
SLITHER_TIMEOUT=300
MYTHRIL_TIMEOUT=300
OYENTE_TIMEOUT=300
SECURIFY_TIMEOUT=300

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@your-domain.com
```

## 🚀 Deployment Platforms

### Vercel (Frontend)

1. **Set Environment Variables in Vercel Dashboard:**
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add all `NEXT_PUBLIC_*` variables

2. **Required Variables for Vercel:**
   ```bash
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
   NEXT_PUBLIC_API_URL
   NEXT_PUBLIC_FRONTEND_URL
   ```

### Render (Backend)

1. **Set Environment Variables in Render Dashboard:**
   - Go to your service settings
   - Navigate to "Environment"
   - Add all backend environment variables

2. **Required Variables for Render:**
   ```bash
   DATABASE_URL
   REDIS_URL
   JWT_SECRET
   NODE_ENV=production
   FRONTEND_URL
   ALLOWED_ORIGINS
   ```

### Railway

1. **Set Environment Variables in Railway Dashboard:**
   - Go to your project
   - Navigate to "Variables"
   - Add all required variables

### Heroku

1. **Set Environment Variables:**
   ```bash
   heroku config:set DATABASE_URL=your-database-url
   heroku config:set JWT_SECRET=your-jwt-secret
   heroku config:set NODE_ENV=production
   ```

## 🔑 Getting API Keys

### Critical API Keys Required:

1. **Etherscan**: https://etherscan.io/apis
2. **PolygonScan**: https://polygonscan.com/apis
3. **BSCScan**: https://bscscan.com/apis
4. **Arbiscan**: https://arbiscan.io/apis
5. **Optimism**: https://optimistic.etherscan.io/apis

### WalletConnect Project ID:

1. Go to https://cloud.walletconnect.com
2. Create a new project
3. Add your production domain to allowed origins
4. Copy the project ID

## ⚠️ Security Best Practices

1. **Never commit real API keys to git**
2. **Use strong JWT secrets** (32+ characters)
3. **Enable HTTPS in production**
4. **Set proper CORS origins**
5. **Use environment-specific configurations**
6. **Rotate API keys regularly**

## 🔄 Environment-Specific Configurations

### Development
- Use `localhost` URLs
- Enable debug mode
- Enable tutorial
- Use development API keys

### Staging
- Use staging domain URLs
- Enable limited analytics
- Use staging API keys
- Enable error monitoring

### Production
- Use production domain URLs
- Enable full analytics
- Use production API keys
- Disable debug mode
- Enable error monitoring

## 📋 Deployment Checklist

- [ ] Set all required environment variables
- [ ] Configure CORS origins correctly
- [ ] Set up database and Redis connections
- [ ] Configure API keys for blockchain explorers
- [ ] Set up WalletConnect project
- [ ] Configure SSL/HTTPS
- [ ] Set up monitoring and analytics
- [ ] Test all functionality in staging
- [ ] Backup environment configurations

## 🆘 Troubleshooting

### Common Issues:

1. **CORS Errors**: Check `ALLOWED_ORIGINS` configuration
2. **API Key Errors**: Verify blockchain explorer API keys
3. **Database Connection**: Check `DATABASE_URL` format
4. **WalletConnect Issues**: Verify project ID and allowed origins
5. **File Upload Issues**: Check `MAX_FILE_SIZE` and `UPLOAD_PATH`

### Support:

- Check the API keys setup guide: `backend/API_KEYS_SETUP.md`
- Review the main deployment guide: `DEPLOYMENT.md`
- Check the technical specification: `TECHNICAL_SPEC.md` 