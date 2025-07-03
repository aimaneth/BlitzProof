# BlitzProof Platform - Production Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Domain name configured
- SSL certificates ready
- API keys for blockchain explorers

### 1. Environment Setup

Copy the environment template and configure your settings:

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

### 2. Required API Keys

Add these API keys to your `backend/.env`:

```env
# Blockchain Explorer APIs
ETHERSCAN_API_KEY=your-etherscan-api-key
POLYGONSCAN_API_KEY=your-polygonscan-api-key
BSCSCAN_API_KEY=your-bscscan-api-key
ARBISCAN_API_KEY=your-arbiscan-api-key
OPTIMISTIC_ETHERSCAN_API_KEY=your-optimistic-etherscan-api-key

# Alternative APIs
ALCHEMY_API_KEY=your-alchemy-api-key
INFURA_API_KEY=your-infura-api-key
```

### 3. SSL Certificates

Place your SSL certificates in `nginx/ssl/`:
- `cert.pem` - Your SSL certificate
- `key.pem` - Your private key

### 4. Deploy with Docker Compose

```bash
# Build and start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
```

## 📊 Monitoring Setup

### Access Monitoring Dashboards

- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090

### Import Grafana Dashboards

1. Access Grafana at http://localhost:3001
2. Import the provided dashboard JSON files from `monitoring/grafana/dashboards/`

## 🔧 Production Configuration

### Environment Variables

#### Backend (.env)
```env
# Production Settings
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://your-domain.com

# Database
DATABASE_URL=postgresql://user:password@postgres:5432/blitzproof_db
REDIS_URL=redis://redis:6379

# Security
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

#### Frontend (.env)
```env
NEXT_PUBLIC_API_URL=https://your-domain.com/api
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id
```

### Nginx Configuration

Update `nginx/nginx.conf` with your domain:

```nginx
server_name your-domain.com;
```

### SSL Configuration

For Let's Encrypt certificates:

```bash
# Install certbot
sudo apt install certbot

# Generate certificates
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
```

## 🔄 Deployment Scripts

### Automated Deployment

```bash
# Deploy to production
./backend/scripts/deploy.sh production

# Deploy to staging
./backend/scripts/deploy.sh staging
```

### PM2 Management

```bash
# Start application
npm run pm2:start

# Check status
npm run pm2:status

# View logs
npm run pm2:logs

# Restart application
npm run pm2:restart

# Stop application
npm run pm2:stop
```

## 📈 Scaling Configuration

### Horizontal Scaling

```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      replicas: 3
    environment:
      - NODE_ENV=production
```

### Load Balancer Setup

```nginx
upstream backend {
    server backend1:4000;
    server backend2:4000;
    server backend3:4000;
}
```

## 🔒 Security Hardening

### Firewall Configuration

```bash
# Allow only necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### Database Security

```sql
-- Create dedicated user with limited privileges
CREATE USER blitzproof_user WITH PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE blitzproof_db TO blitzproof_user;
GRANT USAGE ON SCHEMA public TO blitzproof_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO blitzproof_user;
```

### SSL/TLS Configuration

```nginx
# Strong SSL configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

## 📊 Backup Strategy

### Database Backups

```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec blitzproof-postgres pg_dump -U blitzproof_user blitzproof_db > backup_$DATE.sql

# Automated daily backup
0 2 * * * /path/to/backup-script.sh
```

### File Upload Backups

```bash
# Backup uploads directory
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/
```

## 🚨 Monitoring & Alerts

### Health Checks

```bash
# Check application health
curl https://your-domain.com/health

# Check metrics
curl https://your-domain.com/metrics
```

### Alert Configuration

Set up alerts for:
- High CPU/Memory usage
- Database connection failures
- API response time > 5s
- Error rate > 5%

## 🔧 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check `ALLOWED_ORIGINS` in backend .env
   - Verify frontend URL is correct

2. **Database Connection**
   - Check PostgreSQL container status
   - Verify DATABASE_URL format

3. **SSL Issues**
   - Verify certificate paths in nginx config
   - Check certificate expiration

4. **Memory Issues**
   - Increase Node.js memory limit
   - Monitor with Grafana dashboards

### Log Analysis

```bash
# Backend logs
docker-compose logs backend

# Nginx logs
docker-compose logs nginx

# Database logs
docker-compose logs postgres
```

## 📞 Support

For deployment issues:
1. Check the logs: `docker-compose logs -f`
2. Verify environment variables
3. Test individual services
4. Check monitoring dashboards

---

**Last Updated**: December 2024  
**Version**: 1.0.0 