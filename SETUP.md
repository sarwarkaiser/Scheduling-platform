# Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Database**
   - Create a PostgreSQL database
   - Update `.env` with your `DATABASE_URL`
   - Run migrations:
     ```bash
     npm run db:migrate
     ```

3. **Set Up Redis** (for background jobs)
   ```bash
   # Using Docker
   docker run -d -p 6379:6379 redis
   
   # Or install Redis locally and start the service
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Access Admin Interface**
   - Navigate to `http://localhost:3000/admin`

## Initial Data Setup

After setting up the database, you'll need to create initial data:

### 1. Create an Organization
```sql
INSERT INTO organizations (id, name, slug, description)
VALUES ('org-1', 'University Hospital', 'university-hospital', 'Main hospital organization');
```

### 2. Create Sites
```sql
INSERT INTO sites (id, "organizationId", name, timezone)
VALUES ('site-1', 'org-1', 'Main Campus', 'America/New_York');
```

### 3. Create Services
```sql
INSERT INTO services (id, "organizationId", name, code)
VALUES ('svc-1', 'org-1', 'Internal Medicine', 'IM');
```

### 4. Create a Program
```sql
INSERT INTO programs (id, "organizationId", name, code)
VALUES ('prog-1', 'org-1', 'Internal Medicine Residency', 'IM-RES');
```

### 5. Create Shift Types
```sql
INSERT INTO shift_types (id, name, code, "pointsWeight")
VALUES 
  ('st-1', 'Night Call', 'NIGHT', 1.5),
  ('st-2', '24 Hour Call', '24H', 2.0),
  ('st-3', 'Weekend Day', 'WEEKEND', 1.2);
```

### 6. Create Call Pool
```sql
INSERT INTO call_pools (id, "programId", name)
VALUES ('pool-1', 'prog-1', 'IM Call Pool');
```

## Testing the Schedule Generation

1. Create a shift template:
   ```sql
   INSERT INTO shift_templates (
     id, "programId", name, "shiftTypeId", "recurrencePattern", 
     "startTime", "endTime", "callPoolId"
   )
   VALUES (
     'tpl-1', 'prog-1', 'Night Call', 'st-1',
     '{"type": "daily", "interval": 1}',
     '18:00', '06:00', 'pool-1'
   );
   ```

2. Use the admin interface at `/admin` to generate a schedule:
   - Program ID: `prog-1`
   - Start Date: Today's date
   - End Date: 7 days from today

## Architecture Overview

### Module Structure
- **Auth**: Authentication and authorization
- **Configuration**: Program, site, service, call pool management
- **Scheduling**: Core scheduling engine with 6-step pipeline
- **Constraints**: Plugin-based constraint system
- **Solver**: Assignment algorithm (greedy, upgradeable to OR Tools)
- **Workflow**: Swap requests and approvals
- **Reporting**: Fairness metrics and statistics
- **Export**: PDF, CSV, iCal generation
- **Audit**: Comprehensive logging

### Key Design Decisions

1. **Multi-Tenant Model**: Option B (single deployment, multiple programs) with Option A data model for future upgrade
2. **Constraint System**: Plugin architecture allows extending without code changes
3. **Solver**: Greedy with backtracking for MVP, designed to upgrade to OR Tools CP SAT
4. **Background Jobs**: All schedule generation runs as background jobs via BullMQ
5. **Explainability**: Every assignment stores explanation, every violation stores reason

## Next Steps

1. **Add Authentication**: Set up NextAuth with your provider
2. **Create Admin UI**: Build CRUD interfaces for all configuration entities
3. **Implement Calendar View**: Show generated schedules in calendar format
4. **Add Notifications**: Email/SMS for schedule changes and swap approvals
5. **Upgrade Solver**: Integrate OR Tools CP SAT for better optimization

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running
- Check database credentials

### Redis Connection Issues
- Verify Redis is running: `redis-cli ping`
- Check `REDIS_HOST` and `REDIS_PORT` in `.env`

### Prisma Issues
- Run `npm run db:generate` after schema changes
- Run `npm run db:push` to sync schema without migrations
