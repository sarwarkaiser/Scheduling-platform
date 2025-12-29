# Multi-Tenant Scheduling Platform

A flexible, multi-tenant scheduling platform for medical residency programs. Each program can define sites, services, call pools, shift templates, constraints, and fairness rules. The engine generates optimized schedules with explanations.

## Features

### Core Capabilities
- **Multi-Tenant Architecture**: Support for multiple organizations, programs, sites, and services
- **Flexible Configuration**: Programs define rules via UI that writes to structured JSON schema
- **Constraint System**: Hard constraints (must never break) and soft constraints (scoring preferences)
- **Explainability**: Every assignment has a "why" and every conflict has a "why not"
- **Plugin Architecture**: Extensible constraints and scoring functions without forking
- **Multi-Site Support**: Sites can have different call types, coverage levels, and resident eligibility

### Scheduling Engine
- **6-Step Pipeline**: Build demand → Eligibility → Ranking → Solve → Explain → Validate
- **Greedy Solver**: Fast MVP with backtracking (upgradeable to OR Tools CP SAT)
- **Fairness Scoring**: Configurable points system for nights, weekends, holidays, site travel
- **Swap Workflow**: Pre-check constraints, approval chains, automatic execution

### Technical Stack
- **Next.js 16** + TypeScript
- **PostgreSQL** + Prisma ORM
- **NextAuth** for authentication
- **BullMQ** for background job processing
- **Export**: PDF, CSV, iCal

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Redis (for background jobs)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd scheduling-platform
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env` file:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/scheduling_platform"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
REDIS_HOST="localhost"
REDIS_PORT="6379"
```

4. Set up the database
```bash
npx prisma migrate dev
npx prisma generate
```

5. Start Redis (for background jobs)
```bash
# Using Docker
docker run -d -p 6379:6379 redis

# Or install Redis locally
```

6. Run the development server
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
scheduling-platform/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   └── admin/             # Admin pages
├── lib/
│   ├── modules/           # Core modules
│   │   ├── auth/         # Authentication
│   │   ├── configuration/ # Program configuration
│   │   ├── scheduling/   # Scheduling engine
│   │   ├── constraints/   # Constraint plugins
│   │   ├── solver/        # Solver implementations
│   │   ├── workflow/      # Swap workflows
│   │   ├── reporting/     # Fairness reporting
│   │   ├── export/        # Export modules
│   │   ├── audit/         # Audit logging
│   │   └── jobs/          # Background jobs
│   ├── types/             # TypeScript types
│   └── prisma.ts          # Prisma client
├── prisma/
│   └── schema.prisma      # Database schema
└── README.md
```

## Domain Model

### Organization Layer
- **Organization**: Hospital or University
- **Site**: Each hospital or location
- **Service**: ER, Psych, IM, Surgery, etc.

### Program Layer
- **Program**: Psych, FM, IM, Surgery
- **ProgramYear**: PGY1, PGY2, etc.
- **Resident**: User plus program membership
- **RotationBlock**: Date range, service, site, call pool mapping
- **CallPool**: Group eligible to cover certain shifts

### Scheduling Layer
- **ShiftType**: Night, 24h, Home call, Weekend day, Pager, Backup
- **ShiftTemplate**: Recurring patterns, coverage required
- **CoverageRequirement**: How many of what type, at which site, at which times
- **ShiftInstance**: Generated per date from templates
- **Assignment**: Shift instance plus resident

### Constraints and Preferences
- **Availability**: Vacation, post call protection, academic day, leave
- **RuleSet**: Per program, per site, per service, per call pool
- **ConstraintDefinition**: Plugin type plus parameters
- **ConstraintEvaluation**: Violations and explanations
- **Preference**: Ranked choices and weights
- **FairnessMetric**: Points system, weekend counts, nights, holidays

### Workflow Layer
- **SwapRequest**: With approval chain
- **ExceptionOverride**: Admin forced assignment with reason
- **AuditLog**: Everything

## Constraint Plugins

The platform includes a plugin architecture for constraints. Default plugins:

- **max_shifts_per_period**: Maximum shifts in a time period
- **min_rest_between**: Minimum rest hours between shifts
- **no_consecutive_24h**: No consecutive 24-hour shifts

To add a custom constraint:

1. Create a new plugin class extending `BaseConstraint`
2. Implement `evaluate()` and `explain()` methods
3. Register it in the constraint registry

## API Endpoints

### Schedule Generation
```
POST /api/schedules/generate
Body: {
  programId: string
  startDate: string (ISO date)
  endDate: string (ISO date)
  callPoolIds?: string[]
  siteIds?: string[]
  userId?: string
  async?: boolean
}
```

### Swap Requests
```
POST /api/swaps
Body: {
  requesterId: string
  assignmentId: string
  targetId?: string
  targetAssignmentId?: string
  reason?: string
}
```

## Development Roadmap

### Phase 1: Platform Skeleton ✅
- [x] Multi program, multi site data model
- [x] Admin CRUD for sites, services, programs, pools, shift types, templates
- [x] Basic calendar views

### Phase 2: Engine v1 ✅
- [x] Template expansion to shift instances
- [x] Eligibility calculation
- [x] Greedy backtracking solver
- [x] Constraint evaluation and conflict report

### Phase 3: Workflows ✅
- [x] Manual edits with live validation
- [x] Publish lock schedule
- [x] Swap workflow with pre checks
- [x] Audit logs

### Phase 4: Exports and Integrations ✅
- [x] PDF, CSV, iCal feeds
- [x] Notifications

### Phase 5: Solver Upgrade (Future)
- [ ] OR Tools CP SAT integration
- [ ] Optimization tuning
- [ ] Better fairness controls

## License

MIT
