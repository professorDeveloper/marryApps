CREATE TABLE "users" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "googleId" TEXT,
    "fullName" TEXT,
    "dateOfBirth" TIMESTAMP WITHOUT TIME ZONE,
    "overAll" INTEGER,
    level TEXT,
    email TEXT,
    "phoneNumber" TEXT,
    "passwordHash" TEXT,
    role TEXT,
    gender TEXT,
    "isAgreedForUserContract" BOOLEAN,
    "isVerified" BOOLEAN,
    "status" TEXT CHECK ("status" IN ('active', 'blocked', 'onhold')),
    "group" TEXT,
    "photo" TEXT,
    "XP" INTEGER DEFAULT 0,
    "balance" BIGINT DEFAULT 0,
    "firebaseToken" TEXT,
    "createdAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    "updatedAt" TIMESTAMP WITHOUT TIME ZONE,
    "deletedAt" TIMESTAMP WITHOUT TIME ZONE
);

CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users" ("email");