CREATE TYPE user_role AS ENUM ('admin', 'moderator', 'student', 'teacher');
CREATE TYPE user_gender AS ENUM ('male', 'female', 'other');
CREATE TYPE user_status AS ENUM ('active', 'blocked', 'onhold');
CREATE TYPE proficiency_level AS ENUM ('B1', 'B2', 'C1', 'C2');

CREATE TABLE "users" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "googleId" TEXT UNIQUE,
    "fullName" TEXT NOT NULL,
    "dateOfBirth" DATE,
    "overAll" INTEGER DEFAULT 0,
    "level" proficiency_level,
    "email" TEXT UNIQUE,
    "phoneNumber" TEXT UNIQUE,
    "passwordHash" TEXT,
    "role" user_role DEFAULT 'student',
    "gender" user_gender DEFAULT 'other',
    "isVerified" BOOLEAN DEFAULT false,
    "status" user_status DEFAULT 'onhold',
    "group" TEXT,
    "photo" TEXT,
    "XP" INTEGER DEFAULT 0 CHECK ("XP" >= 0),
    "balance" BIGINT DEFAULT 0 CHECK ("balance" >= 0),
    "firebaseToken" TEXT UNIQUE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT check_email_format CHECK ("email" ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
    CONSTRAINT check_phone_format CHECK ("phoneNumber" ~ '^\+?[0-9\-\s\(\)]{7,}$' OR "phoneNumber" IS NULL)
);

CREATE INDEX "idx_users_email" ON "users" ("email");
CREATE INDEX "idx_users_googleId" ON "users" ("googleId");
CREATE INDEX "idx_users_phoneNumber" ON "users" ("phoneNumber");
CREATE INDEX "idx_users_role" ON "users" ("role");
CREATE INDEX "idx_users_status" ON "users" ("status");
CREATE INDEX "idx_users_group" ON "users" ("group");
CREATE INDEX "idx_users_createdAt" ON "users" ("createdAt");
CREATE INDEX "idx_users_deletedAt" ON "users" ("deletedAt");

CREATE INDEX "idx_users_status_role" ON "users" ("status", "role");
CREATE INDEX "idx_users_group_status" ON "users" ("group", "status");

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();