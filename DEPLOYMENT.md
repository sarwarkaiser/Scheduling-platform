# DEPLOYMENT GUIDE

## Production Deployment Options

This guide covers multiple deployment options for the Scheduling Platform.

---

## Table of Contents

1. [Quick Start (Docker)](#quick-start-docker)
2. [Manual Deployment](#manual-deployment)
3. [Cloud Platform Deployment](#cloud-platform-deployment)
4. [Database Setup](#database-setup)
5. [Post-Deployment Checklist](#post-deployment-checklist)

---

## Quick Start (Docker)

### Prerequisites
- Docker 20+
- Docker Compose 2+

### Steps

1. **Clone and Configure:**
```bash
git clone https://github.com/sarwarkaiser/Scheduling-platform.git
cd Scheduling-platform
cp .env.example .env
```

2. **Update environment variables:**
```bash
# Edit .env and set:
# - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)
# - DATABASE_URL (if using external database)
# - NEXTAUTH_URL (your production domain)
```

3. **Deploy with Docker Compose:**
```bash
# Development (with Redis and PostgreSQL)
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

4. **Run database migrations:**
```bash
docker exec scheduling-app npx prisma migrate deploy
docker exec scheduling-app npx prisma generate
```

5. **Access the application:**
- Development: http://localhost:3001
- Production: http://localhost:3000

---

## Manual Deployment

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+ (optional, for background jobs)
- PM2 or similar process manager

### Steps

1. **Install system dependencies:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y nodejs npm postgresql postgresql-contrib redis-server

# CentOS/RHEL
sudo yum install -y nodejs npm postgresql-server postgresql-contrib redis
```

2. **Set up PostgreSQL:**
```bash
sudo -u postgres psql
CREATE DATABASE scheduling_platform;
CREATE USER scheduling WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE scheduling_platform TO scheduling;
\q
```

3. **Clone and install:**
```bash
cd /var/www
git clone https://github.com/sarwarkaiser/Scheduling-platform.git
cd Scheduling-platform
npm ci --production
```

4. **Configure environment:**
```bash
cp .env.example .env
nano .env  # Update with your values
```

5. **Build the application:**
```bash
npm run build
```

6. **Run migrations:**
```bash
npx prisma migrate deploy
npx prisma generate
```

7. **Start with PM2:**
```bash
npm install -g pm2
pm2 start npm --name "scheduling-platform" -- start
pm2 save
pm2 startup
```

---

## Cloud Platform Deployment

### Vercel (Recommended for Frontend)

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Deploy:**
```bash
vercel login
vercel --prod
```

3. **Set environment variables in Vercel dashboard:**
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

**Note:** Vercel doesn't support long-running processes. For background jobs, use a separate service.

### AWS Deployment

#### Using ECS/Fargate:

1. **Build and push Docker image:**
```bash
docker build -t your-ecr-repo.dkr.ecr.region.amazonaws.com/scheduling-platform:latest .
aws ecr get-login-password --region region | docker login --username AWS --password-stdin your-ecr-repo.dkr.ecr.region.amazonaws.com
docker push your-ecr-repo.dkr.ecr.region.amazonaws.com/scheduling-platform:latest
```

2. **Create ECS task definition and service**

3. **Use RDS for PostgreSQL and ElastiCache for Redis**

#### Using EC2:

Follow the [Manual Deployment](#manual-deployment) steps on an EC2 instance.

### DigitalOcean App Platform

1. **Connect your GitHub repository**
2. **Configure build command:** `npm run build`
3. **Configure start command:** `npm start`
4. **Add managed database (PostgreSQL)**
5. **Set environment variables**

### Railway

1. **Connect GitHub repository**
2. **Add PostgreSQL plugin**
3. **Add Redis plugin (optional)**
4. **Deploy automatically on push**

---

## Database Setup

### Production Database Configuration

1. **Create database user:**
```sql
CREATE USER scheduling WITH ENCRYPTED PASSWORD 'your_secure_password';
```

2. **Create database:**
```sql
CREATE DATABASE scheduling_platform OWNER scheduling;
```

3. **Grant privileges:**
```sql
GRANT ALL PRIVILEGES ON DATABASE scheduling_platform TO scheduling;
```

4. **Run migrations:**
```bash
DATABASE_URL="postgresql://scheduling:your_secure_password@host:5432/scheduling_platform" npx prisma migrate deploy
```

### Database Backup Strategy

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U scheduling -h localhost scheduling_platform > backup_$DATE.sql
gzip backup_$DATE.sql
# Upload to S3 or other storage
```

---

## Post-Deployment Checklist

### Security
- [ ] Change default passwords
- [ ] Set strong `NEXTAUTH_SECRET` (32+ characters)
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Set up rate limiting
- [ ] Review security headers

### Database
- [ ] Run all migrations
- [ ] Set up automated backups
- [ ] Configure connection pooling
- [ ] Test database connectivity

### Monitoring
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure logging
- [ ] Set up uptime monitoring
- [ ] Configure alerts

### Performance
- [ ] Enable caching
- [ ] Configure CDN for static assets
- [ ] Set up database indexes
- [ ] Test load times

### Backup & Recovery
- [ ] Schedule database backups
- [ ] Test restore procedure
- [ ] Document recovery steps

---

## Environment Variables Reference

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | - |
| `NEXTAUTH_URL` | Yes | Application URL | `http://localhost:3001` |
| `NEXTAUTH_SECRET` | Yes | Session encryption secret | - |
| `REDIS_HOST` | No | Redis host | `localhost` |
| `REDIS_PORT` | No | Redis port | `6379` |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID | - |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret | - |
| `NODE_ENV` | No | Environment | `production` |

---

## Troubleshooting

### Database Connection Issues
```bash
# Test connection
psql $DATABASE_URL

# Check Prisma connection
npx prisma db pull
```

### Build Errors
```bash
# Clear cache
rm -rf node_modules .next
npm install
npm run build
```

### Runtime Errors
```bash
# Check logs
pm2 logs scheduling-platform

# Or Docker logs
docker logs scheduling-app
```

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/sarwarkaiser/Scheduling-platform/issues
- Documentation: See README.md
