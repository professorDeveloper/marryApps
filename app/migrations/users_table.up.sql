CREATE TABLE "users" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "fullName" TEXT,
    "dateOfBirth" TIMESTAMP WITHOUT TIME ZONE,
    "overAll" INTEGER,
    "level" TEXT CHECK ("level" IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    "email" TEXT UNIQUE,
    "phoneNumber" BIGINT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT,
    "createdAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    "deletedAt" BIGINT,
    "gender" TEXT DEFAULT 'male' CHECK ("gender" IN ('male', 'female')),
    "isAgreedForUserContract" BOOLEAN,
    "isVerified" BOOLEAN DEFAULT FALSE,
    "status" TEXT CHECK ("status" IN ('active', 'blocked', 'onhold')),
    "group" TEXT,
    "photo" TEXT,
    "XP" INTEGER DEFAULT 0,
    "balance" BIGINT DEFAULT 0,
    "firebaseToken" TEXT
);

CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users" ("email");