-- AlterTable: track when a ticket entered on_hold status, and which ticket it was merged into
ALTER TABLE "tickets" ADD COLUMN "on_hold_since" TIMESTAMPTZ;
ALTER TABLE "tickets" ADD COLUMN "merged_into" INTEGER;
