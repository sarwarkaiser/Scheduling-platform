# Manual Shift Management Guide

## Overview

The Manual Shift Management feature allows you to create custom shifts with specific hours, different from your automated templates. This is perfect for:

- **Special rotations** with unique hours
- **Make-up shifts** for residents who missed time
- **Conference coverage** with different schedules
- **Holiday coverage** with reduced hours
- **Custom programs** (e.g., research half-days)

---

## Features

### ✅ What You Can Do

1. **Custom Hours**
   - Set any start/end time (e.g., 09:00-13:00 for half-day)
   - Overnight shifts supported (e.g., 17:00-07:00)
   - Different hours per shift

2. **Multiple Residents**
   - Assign 1 or more residents to the same shift
   - Perfect for team-based coverage

3. **Program-Specific**
   - Different programs can have different standard hours
   - Example: Surgery (05:00-17:00) vs Psychiatry (09:00-17:00)

4. **Full Management**
   - Create, edit, delete manual shifts
   - Filter by date
   - View all manual shifts in one place

---

## How to Use

### Step 1: Navigate to Manual Shifts

1. Go to `/admin/schedules`
2. Click **"Manual Shifts"** tab
3. You'll see the manual shift manager

### Step 2: Create a Manual Shift

Click **"+ Add Manual Shift"** and fill in:

#### Required Fields:
- **Date:** When the shift occurs
- **Start Time:** e.g., `07:00`
- **End Time:** e.g., `17:00`
- **Shift Type:** Night, Day, 24h, etc.
- **Site:** Which hospital/location
- **Residents:** At least 1 resident must be assigned

#### Optional Fields:
- **Service:** Specific service (IM, EM, PSY)
- **Notes:** Any special instructions

### Step 3: Save

Click **"Add Shift"** - it will appear in your list immediately.

---

## Examples

### Example 1: Half-Day Conference

```
Date: 2026-04-15
Time: 08:00 - 12:00
Shift Type: Day Shift
Site: Main Campus
Residents: John Doe, Jane Smith
Notes: "Morning conference - no clinical duties"
```

### Example 2: Overnight Call

```
Date: 2026-04-20
Time: 18:00 - 06:00 (next day)
Shift Type: Night Call
Site: Community Hospital
Residents: Bob Wilson
Notes: "Solo coverage"
```

### Example 3: Weekend Team

```
Date: 2026-04-22 (Saturday)
Time: 09:00 - 17:00
Shift Type: Weekend Day
Site: Main Campus
Service: Emergency Medicine
Residents: Alice Johnson, Charlie Brown
Notes: "Weekend ED coverage"
```

### Example 4: Different Program Hours

**Surgery Program:**
```
Time: 05:00 - 17:00 (12 hours)
Rounds at 05:00, OR starts at 07:00
```

**Psychiatry Program:**
```
Time: 09:00 - 17:00 (8 hours)
Clinic-based schedule
```

**Internal Medicine:**
```
Time: 06:00 - 18:00 (12 hours)
Traditional ward schedule
```

---

## Program-Specific Hour Templates

### Common Program Schedules

#### Internal Medicine
| Rotation | Hours | Notes |
|----------|-------|-------|
| Ward | 06:00-18:00 | Traditional |
| ICU | 07:00-19:00 | 12h shifts |
| Night Float | 18:00-07:00 | Overnight |
| Ambulatory | 08:00-17:00 | Clinic |

#### Surgery
| Rotation | Hours | Notes |
|----------|-------|-------|
| OR | 05:00-17:00 | Early rounds |
| Trauma | 07:00-19:00 | 12h shifts |
| Night Call | 17:00-07:00 | Home call |

#### Emergency Medicine
| Rotation | Hours | Notes |
|----------|-------|-------|
| Day Shift | 07:00-19:00 | 12h |
| Night Shift | 19:00-07:00 | 12h |
| Pediatric EM | 08:00-20:00 | 12h |

#### Psychiatry
| Rotation | Hours | Notes |
|----------|-------|-------|
| Inpatient | 08:00-17:00 | 9h |
| Outpatient | 09:00-17:00 | 8h |
| Consult | 08:00-16:00 | 8h |

---

## Managing Manual Shifts

### View Shifts

- **All shifts** are shown grouped by date
- **Filter** by specific date using the date picker
- **Stats** show total shifts, assignments, etc.

### Edit a Shift

1. Click the **pencil icon** (✏️) on any shift
2. Modify the details
3. Save changes

### Delete a Shift

1. Click the **trash icon** (🗑️) on any shift
2. Confirm deletion
3. Shift and all assignments are removed

---

## Integration with Auto-Generated Schedules

### How They Work Together

- **Manual shifts** are created individually
- **Auto-generated** shifts come from templates
- Both appear in the **Calendar view**
- Both are included in **exports** (PDF, iCal)

### Best Practices

1. **Use templates** for regular, recurring shifts
2. **Use manual** for:
   - One-off exceptions
   - Special events
   - Make-up shifts
   - Conference coverage

3. **Don't duplicate** - if you create a manual shift, don't also generate it via template

---

## API Reference

### Create Manual Shift

```typescript
POST /api/schedules/manual

Body: {
  programId: string
  date: string (YYYY-MM-DD)
  startTime: string (HH:MM)
  endTime: string (HH:MM)
  shiftTypeId: string
  siteId: string
  serviceId?: string
  residentIds: string[]
  notes?: string
}

Response: {
  id: string
  message: "Manual shift created successfully"
  assignments: number
}
```

### Fetch Manual Shifts

```typescript
GET /api/schedules/manual?programId=xxx&startDate=2026-04-01&endDate=2026-04-30

Response: ManualShift[]
```

### Delete Manual Shift

```typescript
DELETE /api/schedules/manual?id=xxx

Response: { message: "Shift deleted successfully" }
```

---

## Troubleshooting

### "End time must be after start time"

**Issue:** You're trying to create a shift where end < start

**Solution:** 
- For overnight shifts, this is OK! The system detects it automatically
- For same-day shifts, ensure end time is after start time

### "At least one resident must be assigned"

**Issue:** You didn't select any residents

**Solution:** Check at least one resident in the assignment grid

### "Shift not appearing in calendar"

**Issue:** Manual shift created but not showing

**Solution:**
1. Refresh the page
2. Check the date range in calendar
3. Ensure program is selected correctly

---

## Tips & Tricks

### Tip 1: Recurring Manual Shifts

For shifts that repeat but aren't in your template:
1. Create the first one manually
2. Use it as a template for future manual shifts
3. Or add it to your automated templates

### Tip 2: Team-Based Scheduling

For shifts that need multiple residents:
1. Create one manual shift
2. Assign 2-4 residents to the same shift
3. All residents get the same assignment

### Tip 3: Partial Day Coverage

For conferences or half-days:
```
Morning: 08:00-12:00
Afternoon: 13:00-17:00
```
Create two separate manual shifts with different residents.

### Tip 4: Holiday Coverage

For reduced holiday staffing:
1. Create manual shift with shorter hours
2. Assign only 1 resident instead of usual 2
3. Add note: "Holiday coverage"

### Tip 5: Cross-Program Shifts

For residents working with multiple programs:
1. Create shift in Program A
2. Create separate shift in Program B
3. Assign same resident to both
4. System will check for conflicts

---

## Comparison: Templates vs Manual

| Feature | Templates | Manual |
|---------|-----------|--------|
| **Best for** | Recurring shifts | One-off shifts |
| **Setup time** | Once, then auto | Per shift |
| **Flexibility** | Fixed pattern | Any hours |
| **Multiple residents** | Via coverage count | Select individually |
| **Editing** | Edit all at once | Edit individually |

**Use both** for maximum flexibility!

---

## Next Steps

1. **Try creating a manual shift** - Go to `/admin/schedules` → Manual Shifts
2. **Experiment with hours** - Try different start/end times
3. **Assign multiple residents** - See how team coverage works
4. **View in calendar** - Switch between Manual and Calendar tabs
5. **Export** - See your manual shifts in PDF/iCal exports

---

## Support

For issues or questions:
- Check `TROUBLESHOOTING.md`
- Review `SCHEDULING_GUIDE.md` for scheduling patterns
- See `FIX_SUMMARY.md` for recent updates

**Manual shift management is now fully integrated into your scheduling platform!** 🎉
