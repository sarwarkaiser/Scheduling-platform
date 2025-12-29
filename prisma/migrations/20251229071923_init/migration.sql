-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sites" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_services" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_years" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "residents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "programYearId" TEXT,
    "employeeId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "partTime" BOOLEAN NOT NULL DEFAULT false,
    "accommodations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "residents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_pools" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_pool_members" (
    "id" TEXT NOT NULL,
    "callPoolId" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_pool_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rotation_blocks" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "callPoolId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rotation_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "durationHours" INTEGER,
    "pointsWeight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shift_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_templates" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shiftTypeId" TEXT NOT NULL,
    "siteId" TEXT,
    "serviceId" TEXT,
    "callPoolId" TEXT,
    "recurrencePattern" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shift_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coverage_requirements" (
    "id" TEXT NOT NULL,
    "shiftTemplateId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "shiftTypeId" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coverage_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_instances" (
    "id" TEXT NOT NULL,
    "shiftTemplateId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "siteId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "generatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shift_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignments" (
    "id" TEXT NOT NULL,
    "shiftInstanceId" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Primary',
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "explanation" TEXT,
    "assignedBy" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availabilities" (
    "id" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "reason" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "availabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rule_sets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "programId" TEXT,
    "siteId" TEXT,
    "serviceId" TEXT,
    "callPoolId" TEXT,
    "programYearId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rule_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "constraint_definitions" (
    "id" TEXT NOT NULL,
    "ruleSetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "pluginType" TEXT NOT NULL,
    "parameters" JSONB NOT NULL,
    "weight" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "constraint_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "constraint_evaluations" (
    "id" TEXT NOT NULL,
    "constraintDefinitionId" TEXT NOT NULL,
    "shiftInstanceId" TEXT,
    "assignmentId" TEXT,
    "residentId" TEXT,
    "violationType" TEXT NOT NULL,
    "severity" DOUBLE PRECISION NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "constraint_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preferences" (
    "id" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fairness_metrics" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "shiftTypeId" TEXT,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "targetValue" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fairness_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fairness_stats" (
    "id" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalPoints" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nightsCount" INTEGER NOT NULL DEFAULT 0,
    "weekendsCount" INTEGER NOT NULL DEFAULT 0,
    "holidaysCount" INTEGER NOT NULL DEFAULT 0,
    "siteTravelCount" INTEGER NOT NULL DEFAULT 0,
    "backupCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fairness_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "swap_requests" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "targetId" TEXT,
    "assignmentId" TEXT NOT NULL,
    "targetAssignmentId" TEXT,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "preCheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "preCheckResults" JSONB,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "swap_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "swap_approvals" (
    "id" TEXT NOT NULL,
    "swapRequestId" TEXT NOT NULL,
    "approverRole" TEXT NOT NULL,
    "approverId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "comment" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "swap_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exception_overrides" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "overriddenBy" TEXT NOT NULL,
    "constraintViolations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exception_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changes" JSONB,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "services_organizationId_code_key" ON "services"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "site_services_siteId_serviceId_key" ON "site_services"("siteId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "programs_organizationId_code_key" ON "programs"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "program_years_programId_year_key" ON "program_years"("programId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "residents_employeeId_key" ON "residents"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "call_pools_programId_name_key" ON "call_pools"("programId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "call_pool_members_callPoolId_residentId_key" ON "call_pool_members"("callPoolId", "residentId");

-- CreateIndex
CREATE UNIQUE INDEX "shift_types_code_key" ON "shift_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "shift_instances_shiftTemplateId_date_key" ON "shift_instances"("shiftTemplateId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "fairness_stats_residentId_periodStart_periodEnd_key" ON "fairness_stats"("residentId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sites" ADD CONSTRAINT "sites_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_services" ADD CONSTRAINT "site_services_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_services" ADD CONSTRAINT "site_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_years" ADD CONSTRAINT "program_years_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "residents" ADD CONSTRAINT "residents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "residents" ADD CONSTRAINT "residents_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "residents" ADD CONSTRAINT "residents_programYearId_fkey" FOREIGN KEY ("programYearId") REFERENCES "program_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_pools" ADD CONSTRAINT "call_pools_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_pool_members" ADD CONSTRAINT "call_pool_members_callPoolId_fkey" FOREIGN KEY ("callPoolId") REFERENCES "call_pools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_pool_members" ADD CONSTRAINT "call_pool_members_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "residents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rotation_blocks" ADD CONSTRAINT "rotation_blocks_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rotation_blocks" ADD CONSTRAINT "rotation_blocks_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "residents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rotation_blocks" ADD CONSTRAINT "rotation_blocks_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rotation_blocks" ADD CONSTRAINT "rotation_blocks_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rotation_blocks" ADD CONSTRAINT "rotation_blocks_callPoolId_fkey" FOREIGN KEY ("callPoolId") REFERENCES "call_pools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_templates" ADD CONSTRAINT "shift_templates_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_templates" ADD CONSTRAINT "shift_templates_shiftTypeId_fkey" FOREIGN KEY ("shiftTypeId") REFERENCES "shift_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_templates" ADD CONSTRAINT "shift_templates_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_templates" ADD CONSTRAINT "shift_templates_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_templates" ADD CONSTRAINT "shift_templates_callPoolId_fkey" FOREIGN KEY ("callPoolId") REFERENCES "call_pools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coverage_requirements" ADD CONSTRAINT "coverage_requirements_shiftTemplateId_fkey" FOREIGN KEY ("shiftTemplateId") REFERENCES "shift_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coverage_requirements" ADD CONSTRAINT "coverage_requirements_shiftTypeId_fkey" FOREIGN KEY ("shiftTypeId") REFERENCES "shift_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_instances" ADD CONSTRAINT "shift_instances_shiftTemplateId_fkey" FOREIGN KEY ("shiftTemplateId") REFERENCES "shift_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_instances" ADD CONSTRAINT "shift_instances_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_shiftInstanceId_fkey" FOREIGN KEY ("shiftInstanceId") REFERENCES "shift_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "residents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availabilities" ADD CONSTRAINT "availabilities_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "residents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_sets" ADD CONSTRAINT "rule_sets_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_sets" ADD CONSTRAINT "rule_sets_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_sets" ADD CONSTRAINT "rule_sets_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_sets" ADD CONSTRAINT "rule_sets_callPoolId_fkey" FOREIGN KEY ("callPoolId") REFERENCES "call_pools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_sets" ADD CONSTRAINT "rule_sets_programYearId_fkey" FOREIGN KEY ("programYearId") REFERENCES "program_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "constraint_definitions" ADD CONSTRAINT "constraint_definitions_ruleSetId_fkey" FOREIGN KEY ("ruleSetId") REFERENCES "rule_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "constraint_evaluations" ADD CONSTRAINT "constraint_evaluations_constraintDefinitionId_fkey" FOREIGN KEY ("constraintDefinitionId") REFERENCES "constraint_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "constraint_evaluations" ADD CONSTRAINT "constraint_evaluations_shiftInstanceId_fkey" FOREIGN KEY ("shiftInstanceId") REFERENCES "shift_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "constraint_evaluations" ADD CONSTRAINT "constraint_evaluations_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "residents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fairness_metrics" ADD CONSTRAINT "fairness_metrics_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fairness_metrics" ADD CONSTRAINT "fairness_metrics_shiftTypeId_fkey" FOREIGN KEY ("shiftTypeId") REFERENCES "shift_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fairness_stats" ADD CONSTRAINT "fairness_stats_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "residents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swap_requests" ADD CONSTRAINT "swap_requests_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swap_requests" ADD CONSTRAINT "swap_requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "residents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swap_requests" ADD CONSTRAINT "swap_requests_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "residents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swap_requests" ADD CONSTRAINT "swap_requests_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swap_approvals" ADD CONSTRAINT "swap_approvals_swapRequestId_fkey" FOREIGN KEY ("swapRequestId") REFERENCES "swap_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exception_overrides" ADD CONSTRAINT "exception_overrides_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
