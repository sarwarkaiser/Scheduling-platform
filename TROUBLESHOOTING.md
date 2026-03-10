# Troubleshooting Guide

## "Generate Schedule" Not Working

### Issue
Clicking "Generate Schedule" doesn't work or redirects to login.

### Solution

#### 1. You Must Be Logged In
The scheduling API requires authentication. Follow these steps:

1. **Log in** at http://localhost:3001/login
   - **Admin:** `admin@example.com` / `demo123`
   - **Resident:** `john.doe@example.com` / `demo123`

2. **Go to Admin Dashboard** at http://localhost:3001/admin
   - You must have ADMIN role to access scheduling features

3. **Use the Generate Schedule Box** on the dashboard page
   - Select a program (e.g., "Internal Medicine Residency")
   - Set start and end dates
   - Click "Generate Schedule"

#### 2. Check Prerequisites
Before generating a schedule, ensure you have:

- ✅ At least one **Program** created
- ✅ At least one **Shift Type** created
- ✅ At least one **Shift Template** created with:
  - A site assigned
  - Recurrence pattern set
  - Start/end dates or ongoing
- ✅ At least one **Resident** in the program
- ✅ Residents added to a **Call Pool**

#### 3. Common Errors

**Error: "One or more shift templates are missing a site"**
- Go to `/admin/sites` and create a site
- Edit your shift templates to assign a site

**Error: "No residents found"**
- Go to `/admin/residents` and add residents
- Ensure they're assigned to the program and call pool

**Error: "No shift templates found"**
- Go to `/admin` dashboard or create templates via database
- Templates define when shifts should be generated

**Schedule generates but shows 0 assignments**
- Check that residents are in the call pool
- Verify no constraint violations blocking assignments
- Check resident availability (no conflicts)

#### 4. Where to Find Generate Schedule

The "Generate Schedule" feature is located on the **Admin Dashboard** (`/admin`), NOT on the Schedule Viewer page (`/admin/schedules`).

**Path:**
```
Home → Admin Console → Admin Dashboard → Scroll down → "Schedule Generation" box
```

### Quick Test

1. Open browser to http://localhost:3001/login
2. Login with: `admin@example.com` / `demo123`
3. You'll see the Admin Dashboard
4. Scroll to "Schedule Generation" section
5. Select "Internal Medicine Residency"
6. Set dates (e.g., today to 7 days from now)
7. Click "Generate Schedule"
8. View results and click "View Schedule"

### Still Not Working?

1. **Check browser console** (F12) for JavaScript errors
2. **Check server logs** for API errors
3. **Verify database has data:**
   ```bash
   npm run db:studio
   ```
4. **Re-seed the database:**
   ```bash
   npm run db:seed
   ```

### Server Logs

To see detailed logs when generating schedules:

```bash
# In a separate terminal
tail -f .next/server/app.log

# Or watch the dev server output
npm run dev
```

Look for lines starting with:
- `API Input:` - Shows what the API received
- `Starting synchronous generation` - Engine started
- `Engine Result:` - Shows results
- `API Error:` - Any errors

### Database Check

Run these queries in Prisma Studio or psql to verify setup:

```sql
-- Check programs
SELECT id, name, code FROM programs;

-- Check shift templates
SELECT id, name, "programId", "siteId", "recurrencePattern" FROM shift_templates;

-- Check residents
SELECT id, "programId", active FROM residents;

-- Check call pool members
SELECT * FROM call_pool_members;
```
