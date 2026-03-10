# Advanced Scheduling Rules Guide

## Overview

The Scheduling Platform now supports **12+ advanced scheduling rules** that can be configured to match real-world residency program requirements including ACGME (US) and Royal College (Canada) standards.

---

## Rule Types

### Hard Constraints (Must Never Break)
- **Violations block assignment** - resident won't be scheduled
- Examples: Max hours, min rest, post-call protection

### Soft Constraints (Preferences)
- **Violations add penalty** - scheduler tries to avoid but can override
- Examples: Weekend balance, site preference, fairness

---

## Available Rules

### 1. Max Shifts Per Period
**Type:** Hard  
**Default:** 5 shifts per week

```typescript
{
  pluginType: "max_shifts_per_period",
  parameters: {
    period: "week",    // week, month, year
    maxShifts: 5
  }
}
```

**Use Case:** Prevent resident burnout, limit workload

---

### 2. Minimum Rest Between Shifts
**Type:** Hard  
**Default:** 8 hours

```typescript
{
  pluginType: "min_rest_between_shifts",
  parameters: {
    minHours: 8
  }
}
```

**Use Case:** ACGME requirement - minimum 8 hours between shifts

---

### 3. Max Consecutive Shifts
**Type:** Hard  
**Default:** 3 shifts

```typescript
{
  pluginType: "max_consecutive_shifts",
  parameters: {
    max: 3
  }
}
```

**Use Case:** Prevent more than 3 consecutive days/night shifts

---

### 4. Max Hours Per Week ⭐ NEW
**Type:** Hard  
**Default:** 80 hours (averaged over 4 weeks)

```typescript
{
  pluginType: "max_hours_per_week",
  parameters: {
    maxHours: 80,
    averagingPeriod: 4  // weeks
  }
}
```

**Use Case:** ACGME 80-hour work week limit

---

### 5. Max Nights Per Month ⭐ NEW
**Type:** Hard  
**Default:** 8 nights

```typescript
{
  pluginType: "max_nights_per_month",
  parameters: {
    maxNights: 8
  }
}
```

**Use Case:** Limit night call frequency (Canadian standard)

---

### 6. Minimum Days Off Per Week ⭐ NEW
**Type:** Hard  
**Default:** 1 day

```typescript
{
  pluginType: "min_days_off_per_week",
  parameters: {
    minDays: 1
  }
}
```

**Use Case:** Ensure at least 1 day off per 7 days

---

### 7. No 24h Call After Night ⭐ NEW
**Type:** Hard  
**Default:** Enabled

```typescript
{
  pluginType: "no_24h_after_night",
  parameters: {}
}
```

**Use Case:** Prevent 24h call the day after night shift

---

### 8. Weekend Frequency ⭐ NEW
**Type:** Soft  
**Default:** Max 3 weekends per month

```typescript
{
  pluginType: "weekend_frequency",
  parameters: {
    maxWeekends: 3,
    period: "month"
  },
  weight: 1.5
}
```

**Use Case:** Fair weekend distribution

---

### 9. Post-Call Protection ⭐ NEW
**Type:** Hard  
**Default:** 14 hours

```typescript
{
  pluginType: "post_call_protection",
  parameters: {
    hours: 14
  }
}
```

**Use Case:** Canadian requirement - 14 hours off after call

---

### 10. Prefer Same Site ⭐ NEW
**Type:** Soft  
**Default:** Weight 0.5

```typescript
{
  pluginType: "prefer_same_site",
  parameters: {
    weight: 0.5
  }
}
```

**Use Case:** Minimize site-switching for residents

---

### 11. Balance Night Shifts ⭐ NEW
**Type:** Soft  
**Default:** Target variance 0.2

```typescript
{
  pluginType: "balance_nights",
  parameters: {
    targetVariance: 0.2
  },
  weight: 2.0
}
```

**Use Case:** Evenly distribute night calls among residents

---

### 12. Max Weekend Nights ⭐ NEW
**Type:** Hard  
**Default:** 2 per month

```typescript
{
  pluginType: "max_weekend_nights",
  parameters: {
    max: 2,
    period: "month"
  }
}
```

**Use Case:** Limit weekend night call burden

---

## Preset Configurations

### ACGME Compliant (US)
```
✅ Max Hours Per Week: 80 (4-week avg)
✅ Min Rest Between: 8 hours
✅ Max Shifts Per Week: 5
✅ Min Days Off Per Week: 1
```

**Click "ACGME Compliant" preset to apply instantly**

---

### Canadian Standards
```
✅ Max Hours Per Week: 60
✅ Post-Call Protection: 14 hours
✅ Max Nights Per Month: 8
✅ Min Days Off Per Week: 1
```

**Click "Canadian Standards" preset to apply instantly**

---

### Fairness Focused
```
✅ Balance Night Shifts (weight: 2.0)
✅ Weekend Frequency: Max 3/month
✅ Prefer Same Site (weight: 0.5)
```

**Click "Fairness Focused" preset to apply instantly**

---

## How to Configure Rules

### Step 1: Navigate to Rules
Go to `/admin/rules` or `/admin` → Rules tab

### Step 2: Add Rules
Click **"+ Add Rule"** and select from available rules

### Step 3: Configure Parameters
Adjust parameters for each rule:
- **Period:** week, month, year
- **Max/Min values:** numbers
- **Weight:** for soft constraints (higher = more important)

### Step 4: Enable/Disable
Toggle rules on/off as needed

### Step 5: Save & Generate
Rules are saved automatically - generate schedule to see effects

---

## Rule Combinations

### Best for Internal Medicine
```
- Max Hours Per Week: 80
- Max Shifts Per Week: 5-6
- Min Rest: 8 hours
- Max Nights Per Month: 8
- Post-Call Protection: 14 hours
- Balance Nights: ON
```

### Best for Surgery
```
- Max Hours Per Week: 80
- Max Shifts Per Week: 6
- Min Rest: 8 hours
- Max Consecutive: 4
- Min Days Off: 1
- Prefer Same Site: ON
```

### Best for Emergency Medicine
```
- Max Hours Per Week: 60-70
- Max Shifts Per Week: 4-5 (12h shifts)
- Min Rest: 10 hours
- Max Nights Per Month: 6
- Weekend Frequency: Max 3
```

### Best for Psychiatry
```
- Max Hours Per Week: 60
- Max Shifts Per Week: 5
- Min Rest: 8 hours
- Min Days Off: 1
- Balance Nights: ON (if applicable)
```

---

## Timing Constraints

### Shift Timing Rules

| Rule | Parameter | Effect |
|------|-----------|--------|
| **Min Rest** | 8 hours | Can't schedule if < 8h since last shift ended |
| **Post-Call** | 14 hours | 14h off after 12h+ shifts |
| **No 24h After Night** | N/A | Blocks 24h call day after night |

### Example Scenarios

#### Scenario 1: Night → Day Shift
```
Night Shift: Mon 17:00 - Tue 07:00
Day Shift:   Tue 07:00 - 17:00  ❌ BLOCKED (0h rest!)
Day Shift:   Tue 15:00 - 01:00  ✅ OK (8h rest)
```

#### Scenario 2: 24h Call Limits
```
Mon 24h Call: 07:00 - Tue 07:00
Tue Night:    17:00 - 07:00  ❌ BLOCKED (10h rest, but too soon after 24h)
Wed Day:      09:00 - 17:00  ✅ OK (26h rest)
```

#### Scenario 3: Weekly Hour Limit
```
Week 1:
- Mon: 12h shift
- Tue: 12h shift
- Wed: 12h shift
- Thu: 12h shift
- Fri: 12h shift
Total: 60h

Sat Shift: 12h  ❌ BLOCKED (would be 72h, exceeds weekly avg)
```

---

## Troubleshooting

### "No eligible residents found"

**Problem:** Rules are too restrictive

**Solutions:**
1. Check which rules are active
2. Increase max values (e.g., max hours from 60 to 80)
3. Reduce min values (e.g., min rest from 12h to 8h)
4. Add more residents to call pool

### "Same resident gets all shifts"

**Problem:** Fairness rules not enabled

**Solution:**
- Enable "Balance Night Shifts"
- Enable "Weekend Frequency"
- Increase weight on soft constraints

### "Schedule takes too long to generate"

**Problem:** Too many conflicting constraints

**Solutions:**
1. Reduce number of hard constraints
2. Convert some to soft constraints
3. Increase resident pool size
4. Reduce coverage requirements

---

## Advanced Configuration

### Custom Rule Weights

For soft constraints, adjust weight to prioritize:

```typescript
// Low priority (nice to have)
weight: 0.5

// Medium priority (should try)
weight: 1.0

// High priority (almost hard constraint)
weight: 3.0
```

### Period Calculations

| Period | Calculation |
|--------|-------------|
| **Week** | Sunday 00:00 - Saturday 23:59 |
| **Month** | 1st 00:00 - Last day 23:59 |
| **Year** | Jan 1 - Dec 31 |
| **4-week avg** | Rolling 28-day window |

### Combining Multiple Rules

Rules stack - all must pass:

```
Resident has:
- Max 80 hours/week AND
- Max 5 shifts/week AND
- Max 8 nights/month AND
- Min 8h rest between

All rules checked for every assignment!
```

---

## API Integration

### Fetch Current Rules
```typescript
GET /api/rules?programId=xxx

Response: RuleConfig[]
```

### Update Rules
```typescript
POST /api/rules

Body: {
  programId: string
  rules: RuleConfig[]
}
```

### RuleConfig Type
```typescript
interface RuleConfig {
  id: string
  name: string
  type: "hard" | "soft"
  pluginType: string
  parameters: Record<string, any>
  weight?: number
  active: boolean
}
```

---

## Testing Rules

### Test with Sample Data
```bash
cd /home/sarwar/Scheduling-platform
DATABASE_URL="..." npx tsx scripts/test-generation.ts
```

### Check Violations
After generation, review:
- **Violations count:** Should be 0 for hard constraints
- **Unassigned shifts:** May indicate over-constrained
- **Score:** Higher = better fairness

---

## Best Practices

### 1. Start Minimal
Begin with 2-3 core rules:
- Max hours per week
- Min rest between
- Max shifts per period

### 2. Add Gradually
Add 1-2 rules at a time, test generation

### 3. Monitor Results
Check:
- Are shifts being filled?
- Are residents happy with distribution?
- Any constraint violations?

### 4. Adjust as Needed
Rules aren't permanent - adjust based on:
- Resident feedback
- Coverage gaps
- Program requirements

### 5. Document Your Rules
Keep track of why each rule exists:
```
Rule: Max 8 nights/month
Reason: Canadian requirement, resident wellness
```

---

## Resources

- **ACGME Standards:** https://www.acgme.org/duty-hours
- **Canadian Guidelines:** https://www.royalcollege.ca/
- **SCHEDULING_GUIDE.md:** General scheduling patterns
- **MANUAL_SHIFTS_GUIDE.md:** Manual shift management

---

**Your scheduling platform now has enterprise-grade rule configuration!** 🎉

Configure rules at `/admin/rules` or via the Rules tab in schedule generation.
