CREATE TABLE "priceForLevels" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "level"TEXT CHECK ("level" IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'C3')),
    "amount" INTEGER,
    "created" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "studentPayments" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "student" TEXT NOT NULL,
    "priceForLevel" TEXT NOT NULL,
    "isPaid" BOOLEAN,
    "clickTransId" INTEGER,
    "clickPayDocId" INTEGER,
    "error" INTEGER,
    "errorNote" TEXT,
    "status" TEXT,
    "merchantPrepareId" INTEGER,
    "paymeId" TEXT,
    "provider" TEXT CHECK ("provider" IN ('click', 'payme', 'cash')),
    "orderNumber" INTEGER,
    "paidAt" BIGINT,
    "timePaymeTransCreated" BIGINT,
    "reason" BIGINT,
    "amount" INTEGER,
    "cancelTime" BIGINT,
    "created" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_student
        FOREIGN KEY ("student")
        REFERENCES "users"("id")
        ON DELETE RESTRICT,
    CONSTRAINT fk_priceForLevel
        FOREIGN KEY ("priceForLevel")
        REFERENCES "priceForLevels"("id")
        ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "idx_studentpayments_student" ON "studentPayments" ("student");
CREATE INDEX IF NOT EXISTS "idx_studentpayments_priceForLevel" ON "studentPayments" ("priceForLevel");