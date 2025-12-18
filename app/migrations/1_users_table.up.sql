CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "googleId" TEXT UNIQUE,
    "fullName" TEXT,
    "dateOfBirth" DATE,
    "overAll" INTEGER DEFAULT 0,
    "email" TEXT UNIQUE NOT NULL,
    "phoneNumber" TEXT UNIQUE,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'student' CHECK ("role" IN ('admin', 'moderator', 'student', 'teacher')),
    "gender" TEXT CHECK ("gender" IN ('male', 'female')),
    "isVerified" BOOLEAN DEFAULT FALSE,
    "status" TEXT NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'blocked', 'onhold')),
    "group" TEXT,
    "photo" TEXT,
    "XP" INTEGER DEFAULT 0,
    "balance" BIGINT DEFAULT 0,
    "firebaseToken" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE,
    "deletedAt" TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users" ("email");
CREATE INDEX IF NOT EXISTS "idx_users_phoneNumber" ON "users" ("phoneNumber");
CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users" ("role");
CREATE INDEX IF NOT EXISTS "idx_users_status" ON "users" ("status");
CREATE INDEX IF NOT EXISTS "idx_users_createdAt" ON "users" ("createdAt");
