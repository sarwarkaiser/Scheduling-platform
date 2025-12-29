# Database Setup Guide

## Option 1: Use Prisma's Local Database (Easiest)

Prisma provides a local PostgreSQL database that's perfect for development:

```bash
npx prisma dev
```

This will:
- Start a local PostgreSQL database
- Generate the Prisma client
- Open Prisma Studio (database GUI)

The connection string will be automatically configured.

## Option 2: Use Your Own PostgreSQL Database

If you have PostgreSQL installed locally or want to use a remote database:

1. **Update `.env` file:**
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
   ```

2. **Create the database** (if it doesn't exist):
   ```sql
   CREATE DATABASE scheduling_platform;
   ```

3. **Run migrations:**
   ```bash
   npm run db:migrate
   ```

## Option 3: Use Docker PostgreSQL

If you have Docker installed:

```bash
docker run --name scheduling-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=scheduling_platform \
  -p 5432:5432 \
  -d postgres:15
```

Then update `.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/scheduling_platform"
```

## Troubleshooting

### "Can't reach database server"
- Make sure PostgreSQL is running
- Check the port number in your connection string
- Verify username and password are correct
- For Prisma dev, make sure `npx prisma dev` is running

### Connection refused
- Check if PostgreSQL service is running
- Verify firewall settings
- Check if the port is correct (default is 5432)

### Authentication failed
- Verify username and password in connection string
- Check PostgreSQL user permissions
- Ensure the database exists

## Next Steps

After setting up the database:

1. **Push the schema:**
   ```bash
   npm run db:push
   ```

2. **Generate Prisma client:**
   ```bash
   npm run db:generate
   ```

3. **Open Prisma Studio** (optional):
   ```bash
   npm run db:studio
   ```
