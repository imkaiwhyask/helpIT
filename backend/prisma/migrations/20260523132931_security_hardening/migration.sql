-- AlterTable
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user';

-- CreateIndex
CREATE INDEX "kb_articles_category_idx" ON "kb_articles"("category");
