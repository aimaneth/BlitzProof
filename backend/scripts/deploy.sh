#!/bin/bash

# BlitzProof Backend Production Deployment Script
# Usage: ./scripts/deploy.sh [production|staging]

set -e

ENVIRONMENT=${1:-production}
echo "🚀 Deploying BlitzProof Backend to $ENVIRONMENT..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    print_error ".env file not found. Please create one from .env.example"
    exit 1
fi

# Load environment variables
source .env

print_status "Installing dependencies..."
npm ci --only=production

print_status "Running database migrations..."
npm run migrate

print_status "Building TypeScript..."
npm run build

print_status "Setting up PM2 process manager..."
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 not found. Installing..."
    npm install -g pm2
fi

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
          name: 'blitzproof-backend',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: '$ENVIRONMENT',
      PORT: $PORT
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: $PORT
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}
EOF

print_status "Creating log directory..."
mkdir -p logs

print_status "Starting application with PM2..."
if [ "$ENVIRONMENT" = "production" ]; then
    pm2 start ecosystem.config.js --env production
else
    pm2 start ecosystem.config.js --env development
fi

print_status "Saving PM2 configuration..."
pm2 save

print_status "Setting up PM2 startup script..."
pm2 startup

print_status "Checking application status..."
pm2 status

print_status "✅ Deployment completed successfully!"
print_status "📊 Monitor logs: pm2 logs blitzproof-backend"
print_status "🔄 Restart: pm2 restart blitzproof-backend"
print_status "⏹️  Stop: pm2 stop blitzproof-backend" 