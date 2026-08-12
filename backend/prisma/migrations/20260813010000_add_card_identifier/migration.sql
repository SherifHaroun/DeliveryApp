-- AlterTable
ALTER TABLE "Card" ADD COLUMN "identifier" TEXT NOT NULL DEFAULT '';

UPDATE "Card"
SET "identifier" = 'CARD-' || "last4"
WHERE "identifier" = '';

CREATE UNIQUE INDEX "Card_identifier_key" ON "Card"("identifier");
