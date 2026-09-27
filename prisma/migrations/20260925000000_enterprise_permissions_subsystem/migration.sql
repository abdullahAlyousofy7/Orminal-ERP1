-- =============================================================================
-- Migration: 20260925000000_enterprise_permissions_subsystem
-- Target: PostgreSQL / Neon Engine
-- Description: Adds canonical enterprise authorization models:
--   1. User security and temporal access window extensions
--   2. Role extensions & RoleInheritance DAG table
--   3. ScreenPrivilege (13 action flags, 344 canonical screens, Role/User dual assignment)
--   4. InputPrivilege (4 record-level flags across master inputs, Role/User dual assignment)
--   5. TransactionPolicy (37 operational policies with typed values)
--   6. FieldPrivilege (field-level masking & visibility controls)
-- =============================================================================

-- 1. Extend "User" table with security, temporal, and enterprise attributes
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "userCode" INTEGER;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pinHash" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "employeeNumber" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "nationalId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "managerId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "validFromDate" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "validToDate" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "validFromTime" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "validToTime" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "defaultPriceLevel" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "minPriceLimit" DECIMAL(65,30);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "maxPriceLimit" DECIMAL(65,30);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordChangeCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastPasswordChangeDate" TIMESTAMP(3);

-- Add foreign key constraint for self-referential manager relation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'User_managerId_fkey'
  ) THEN
    ALTER TABLE "User" ADD CONSTRAINT "User_managerId_fkey"
      FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "User_userCode_idx" ON "User"("userCode");
CREATE INDEX IF NOT EXISTS "User_managerId_idx" ON "User"("managerId");
CREATE INDEX IF NOT EXISTS "User_employeeNumber_idx" ON "User"("employeeNumber");
CREATE INDEX IF NOT EXISTS "User_nationalId_idx" ON "User"("nationalId");

-- 2. Extend "Role" table
ALTER TABLE "Role" ADD COLUMN IF NOT EXISTS "roleCode" INTEGER;
ALTER TABLE "Role" ADD COLUMN IF NOT EXISTS "isSuspended" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "Role_roleCode_idx" ON "Role"("roleCode");

-- 3. Create "RoleInheritance" table (DAG)
CREATE TABLE IF NOT EXISTS "RoleInheritance" (
  "id" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "parentRoleId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RoleInheritance_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RoleInheritance_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RoleInheritance_parentRoleId_fkey" FOREIGN KEY ("parentRoleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "RoleInheritance_roleId_parentRoleId_key" ON "RoleInheritance"("roleId", "parentRoleId");
CREATE INDEX IF NOT EXISTS "RoleInheritance_roleId_idx" ON "RoleInheritance"("roleId");
CREATE INDEX IF NOT EXISTS "RoleInheritance_parentRoleId_idx" ON "RoleInheritance"("parentRoleId");

-- 4. Create "ScreenPrivilege" table (13 action flags)
CREATE TABLE IF NOT EXISTS "ScreenPrivilege" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "roleId" TEXT,
  "userId" TEXT,
  "screenCode" TEXT NOT NULL,
  "screenTitle" TEXT,
  "canInclude" BOOLEAN NOT NULL DEFAULT true,
  "canAdd" BOOLEAN NOT NULL DEFAULT false,
  "canEdit" BOOLEAN NOT NULL DEFAULT false,
  "canDelete" BOOLEAN NOT NULL DEFAULT false,
  "canView" BOOLEAN NOT NULL DEFAULT true,
  "canPrint" BOOLEAN NOT NULL DEFAULT false,
  "canCancelDoc" BOOLEAN NOT NULL DEFAULT false,
  "canPost" BOOLEAN NOT NULL DEFAULT false,
  "canSuspend" BOOLEAN NOT NULL DEFAULT false,
  "canViewJournal" BOOLEAN NOT NULL DEFAULT false,
  "canScreenVars" BOOLEAN NOT NULL DEFAULT false,
  "canReview" BOOLEAN NOT NULL DEFAULT false,
  "canStop" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScreenPrivilege_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ScreenPrivilege_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ScreenPrivilege_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "ScreenPrivilege_companyId_roleId_screenCode_key" ON "ScreenPrivilege"("companyId", "roleId", "screenCode");
CREATE INDEX IF NOT EXISTS "ScreenPrivilege_companyId_idx" ON "ScreenPrivilege"("companyId");
CREATE INDEX IF NOT EXISTS "ScreenPrivilege_companyId_screenCode_idx" ON "ScreenPrivilege"("companyId", "screenCode");
CREATE INDEX IF NOT EXISTS "ScreenPrivilege_roleId_idx" ON "ScreenPrivilege"("roleId");
CREATE INDEX IF NOT EXISTS "ScreenPrivilege_userId_idx" ON "ScreenPrivilege"("userId");
CREATE INDEX IF NOT EXISTS "ScreenPrivilege_screenCode_idx" ON "ScreenPrivilege"("screenCode");

-- 5. Create "InputPrivilege" table (4 record-level flags)
CREATE TABLE IF NOT EXISTS "InputPrivilege" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "roleId" TEXT,
  "userId" TEXT,
  "inputCode" TEXT NOT NULL,
  "recordId" TEXT NOT NULL,
  "recordTitle" TEXT,
  "canScreen" BOOLEAN NOT NULL DEFAULT true,
  "canReports" BOOLEAN NOT NULL DEFAULT true,
  "canDownload" BOOLEAN NOT NULL DEFAULT false,
  "canAccess" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InputPrivilege_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InputPrivilege_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "InputPrivilege_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "InputPrivilege_companyId_roleId_inputCode_recordId_key" ON "InputPrivilege"("companyId", "roleId", "inputCode", "recordId");
CREATE INDEX IF NOT EXISTS "InputPrivilege_companyId_idx" ON "InputPrivilege"("companyId");
CREATE INDEX IF NOT EXISTS "InputPrivilege_companyId_inputCode_idx" ON "InputPrivilege"("companyId", "inputCode");
CREATE INDEX IF NOT EXISTS "InputPrivilege_roleId_idx" ON "InputPrivilege"("roleId");
CREATE INDEX IF NOT EXISTS "InputPrivilege_userId_idx" ON "InputPrivilege"("userId");
CREATE INDEX IF NOT EXISTS "InputPrivilege_inputCode_idx" ON "InputPrivilege"("inputCode");

-- 6. Create "TransactionPolicy" table (37 operational policies)
CREATE TABLE IF NOT EXISTS "TransactionPolicy" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "roleId" TEXT,
  "userId" TEXT,
  "policyKey" TEXT NOT NULL,
  "boolValue" BOOLEAN,
  "numValue" DECIMAL(65,30),
  "strValue" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TransactionPolicy_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TransactionPolicy_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TransactionPolicy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "TransactionPolicy_companyId_roleId_policyKey_key" ON "TransactionPolicy"("companyId", "roleId", "policyKey");
CREATE UNIQUE INDEX IF NOT EXISTS "TransactionPolicy_companyId_userId_policyKey_key" ON "TransactionPolicy"("companyId", "userId", "policyKey");
CREATE INDEX IF NOT EXISTS "TransactionPolicy_companyId_idx" ON "TransactionPolicy"("companyId");
CREATE INDEX IF NOT EXISTS "TransactionPolicy_companyId_policyKey_idx" ON "TransactionPolicy"("companyId", "policyKey");
CREATE INDEX IF NOT EXISTS "TransactionPolicy_roleId_idx" ON "TransactionPolicy"("roleId");
CREATE INDEX IF NOT EXISTS "TransactionPolicy_userId_idx" ON "TransactionPolicy"("userId");
CREATE INDEX IF NOT EXISTS "TransactionPolicy_policyKey_idx" ON "TransactionPolicy"("policyKey");

-- 7. Create "FieldPrivilege" table
CREATE TABLE IF NOT EXISTS "FieldPrivilege" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "roleId" TEXT,
  "userId" TEXT,
  "screenCode" TEXT NOT NULL,
  "fieldKey" TEXT NOT NULL,
  "mode" TEXT NOT NULL DEFAULT 'VISIBLE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FieldPrivilege_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FieldPrivilege_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "FieldPrivilege_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "FieldPrivilege_companyId_roleId_screenCode_fieldKey_key" ON "FieldPrivilege"("companyId", "roleId", "screenCode", "fieldKey");
CREATE INDEX IF NOT EXISTS "FieldPrivilege_companyId_idx" ON "FieldPrivilege"("companyId");
CREATE INDEX IF NOT EXISTS "FieldPrivilege_roleId_idx" ON "FieldPrivilege"("roleId");
CREATE INDEX IF NOT EXISTS "FieldPrivilege_userId_idx" ON "FieldPrivilege"("userId");
CREATE INDEX IF NOT EXISTS "FieldPrivilege_screenCode_idx" ON "FieldPrivilege"("screenCode");
