# Residency Scheduling Guide

## Overview

This guide explains how residency scheduling works in North America (Canada/US) and how to configure your Scheduling Platform accordingly.

---

## Residency Scheduling Basics

### Typical Program Structure

**Internal Medicine / Family Medicine Residency:**
- **Duration:** 3-5 years (PGY1, PGY2, PGY3, etc.)
- **Residents per year:** 8-15 residents
- **Total program size:** 24-45 residents

### Common Shift Types

| Shift Type | Duration | Typical Coverage | Frequency |
|------------|----------|------------------|-----------|
| **Day Shift** | 10-12 hours (7am-5pm) | 2-4 residents | Weekdays |
| **Night Call** | 12-14 hours (5pm-7am) | 1-2 residents | Daily |
| **24 Hour Call** | 24 hours (7am-7am) | 1 resident | Every 3-5 days |
| **Weekend Day** | 10 hours (8am-6pm) | 1-2 residents | Sat/Sun |
| **Home Call** | Variable | 1-2 residents | As needed |

### ACGME Duty Hour Limits (US)

- **Maximum weekly hours:** 80 hours/week (averaged over 4 weeks)
- **Maximum shift length:** 24 hours + 4 hours for transitions
- **Minimum time off:** 8 hours between shifts
- **Maximum consecutive nights:** 3-4 nights
- **Days off:** 1 day off per week (free from all clinical duties)

### Canadian Requirements (Royal College)

- **Maximum weekly hours:** Varies by province (typically 60-80 hours)
- **Call frequency:** Maximum 1:2 or 1:3 call (every 2nd or 3rd night)
- **Post-call protection:** 14 hours off after 24h call
- **Vacation:** 4 weeks per year

---

## Platform Configuration

### Creating Shift Templates

#### Example 1: Day Shift (Weekdays, Multiple Residents)

```typescript
// Template: Day Shift - Monday to Friday
{
  name: "Day Shift",
  shiftTypeId: "DAY",
  recurrencePattern: {
    type: "weekly",
    days: [1, 2, 3, 4, 5], // Mon=1, Tue=2, Wed=3, Thu=4, Fri=5
    interval: 1
  },
  startTime: "07:00",
  endTime: "17:00",
  coverageRequirements: [
    { role: "Primary", count: 2, priority: 1 },    // 2 primary residents
    { role: "Backup", count: 1, priority: 2 }      // 1 backup resident
  ]
}
```

**Result:** Each weekday will have 3 residents assigned (2 Primary + 1 Backup)

#### Example 2: Night Call (Daily)

```typescript
{
  name: "Night Call",
  shiftTypeId: "NIGHT",
  recurrencePattern: {
    type: "daily",
    interval: 1
  },
  startTime: "17:00",
  endTime: "07:00",
  coverageRequirements: [
    { role: "Primary", count: 1, priority: 1 }
  ]
}
```

**Result:** Every night has 1 resident on call

#### Example 3: Weekend Coverage

```typescript
{
  name: "Weekend Day",
  shiftTypeId: "WEEKEND",
  recurrencePattern: {
    type: "weekly",
    days: [0, 6], // Sun=0, Sat=6
    interval: 1
  },
  startTime: "08:00",
  endTime: "18:00",
  coverageRequirements: [
    { role: "Primary", count: 2, priority: 1 }
  ]
}
```

**Result:** Each weekend day has 2 residents

---

## Multiple Residents Per Day

### How It Works

The platform supports assigning **multiple residents per shift** through `coverageRequirements`:

```typescript
// Assign 3 residents to the same day shift
coverageRequirements: [
  { role: "Primary", count: 3, priority: 1 }
]

// Or mix of roles
coverageRequirements: [
  { role: "Senior", count: 1, priority: 1 },
  { role: "Junior", count: 2, priority: 1 },
  { role: "Intern", count: 1, priority: 2 }
]
```

### Role-Based Assignment

Different roles allow hierarchical scheduling:

| Role | Description | Count |
|------|-------------|-------|
| **Primary** | Main coverage resident | 1-2 |
| **Senior** | PGY2/PGY3 supervising | 1 |
| **Junior** | PGY1 resident | 1-2 |
| **Backup** | Second call backup | 1 |
| **Chief** | Chief resident on call | 1 |

---

## Sample Schedule Patterns

### Pattern 1: Traditional Call (1:3 Call)

Each resident works every 3rd night:

```
Resident A: Day 1, 4, 7, 10, 13...
Resident B: Day 2, 5, 8, 11, 14...
Resident C: Day 3, 6, 9, 12, 15...
```

**Configuration:**
- 1 night call template (daily)
- 1 coverage requirement (count: 1)
- Solver automatically distributes among residents

### Pattern 2: Day + Night Team

Separate day and night teams:

```
Day Team (7am-5pm):
- 2 residents per day
- Weekdays only

Night Team (5pm-7am):
- 1 resident per night
- Daily
```

**Configuration:**
- 2 templates (Day + Night)
- Different coverage counts
- Can assign different resident pools

### Pattern 3: Rotating Services

Different services (ER, IM, ICU) with different coverage:

```
Week 1-4: ER Rotation (4 residents)
Week 5-8: IM Ward (3 residents)
Week 9-12: ICU (2 residents)
```

**Configuration:**
- Create separate templates per service
- Use rotation blocks to assign residents to services
- Set service-specific coverage requirements

---

## Best Practices

### 1. Fairness

The platform tracks:
- **Night shifts** per resident (target: 4-5 per month)
- **Weekend shifts** per resident (target: 3-4 per month)
- **Total points** (weighted by shift type)
- **Holiday coverage** (rotated fairly)

### 2. Constraints

Common constraints to configure:

```typescript
// Max shifts per week
{
  pluginType: "max_shifts_per_period",
  parameters: { period: "week", max: 5 }
}

// Min rest between shifts
{
  pluginType: "min_rest_between",
  parameters: { hours: 8 }
}

// No consecutive 24h calls
{
  pluginType: "no_consecutive_24h",
  parameters: {}
}

// Max consecutive nights
{
  pluginType: "max_consecutive_shifts",
  parameters: { max: 3 }
}
```

### 3. Vacation & Time Off

- Residents request vacation in advance
- System marks them as "unavailable" during those periods
- Solver automatically skips unavailable residents

### 4. Post-Call Protection

After a 24h call or night shift:
- Minimum 14 hours off (Canada)
- Minimum 8 hours off (US)
- Configured via `min_rest_between` constraint

---

## Real-World Example: 30-Resident Program

### Program Setup

```
Program: Internal Medicine Residency
Residents: 30 (10 per PGY year)
Sites: 2 (Main Hospital, Community Hospital)
Services: IM, ER, ICU, CCU
```

### Templates Created

| Template | Days | Time | Residents/Shift | Total/Month |
|----------|------|------|-----------------|-------------|
| Day Shift | Mon-Fri | 07:00-17:00 | 3 | 60 |
| Night Call | Daily | 17:00-07:00 | 2 | 60 |
| Weekend | Sat-Sun | 08:00-18:00 | 2 | 16 |
| 24h Call | Daily | 07:00-07:00 | 1 | 30 |

### Monthly Distribution Per Resident

```
Average per resident:
- Day shifts: 8-10
- Night calls: 4-5
- Weekends: 2-3
- 24h calls: 1-2
Total shifts: ~15-20 per month
```

---

## Troubleshooting

### "Only night shifts are generating"

**Problem:** You only created a night shift template!

**Solution:** Create multiple templates for different shift types:
1. Go to `/admin` dashboard
2. Create shift templates for:
   - Day shifts (weekdays)
   - Weekend shifts
   - 24h call (if applicable)
3. Set coverage requirements for each
4. Generate schedule

### "Only 1 resident assigned per day"

**Problem:** Coverage requirement is set to `count: 1`

**Solution:** Increase the count:
```typescript
coverageRequirements: [
  { role: "Primary", count: 3 } // 3 residents per shift
]
```

### "Same resident gets all shifts"

**Problem:** No constraints configured

**Solution:** Add constraints:
- Max shifts per week
- Min rest between shifts
- Enable fairness scoring

---

## Quick Reference

### Recurrence Patterns

```typescript
// Daily
{ type: "daily", interval: 1 }

// Every other day
{ type: "daily", interval: 2 }

// Weekdays only (Mon-Fri)
{ type: "weekly", days: [1,2,3,4,5], interval: 1 }

// Weekends only (Sat-Sun)
{ type: "weekly", days: [0,6], interval: 1 }

// Specific days (Mon, Wed, Fri)
{ type: "weekly", days: [1,3,5], interval: 1 }

// Monthly (first day of month)
{ type: "monthly", interval: 1 }
```

### Day Number Mapping

| Day | Number |
|-----|--------|
| Sunday | 0 |
| Monday | 1 |
| Tuesday | 2 |
| Wednesday | 3 |
| Thursday | 4 |
| Friday | 5 |
| Saturday | 6 |

---

## Next Steps

1. **Review your templates** - Do you have day, night, weekend coverage?
2. **Set coverage counts** - How many residents per shift?
3. **Configure constraints** - Max shifts, min rest, etc.
4. **Generate and review** - Check fairness distribution
5. **Adjust as needed** - Tweak templates and regenerate

---

## Resources

- **ACGME Duty Hours:** https://www.acgme.org/programs-and-institutions/duty-hours
- **Royal College (Canada):** https://www.royalcollege.ca/
- **Resident Duty Hours:** https://www.residentdutyhours.org/
