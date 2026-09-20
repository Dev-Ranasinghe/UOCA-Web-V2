-- AlterTable
ALTER TABLE "Article" DROP COLUMN "scheduledAt";

-- AlterEnum: drop SCHEDULED from ContentStatus (no rows currently use it)
BEGIN;
CREATE TYPE "ContentStatus_new" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
ALTER TABLE "Project" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Project" ALTER COLUMN "status" TYPE "ContentStatus_new" USING ("status"::text::"ContentStatus_new");
ALTER TABLE "Article" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Article" ALTER COLUMN "status" TYPE "ContentStatus_new" USING ("status"::text::"ContentStatus_new");
ALTER TYPE "ContentStatus" RENAME TO "ContentStatus_old";
ALTER TYPE "ContentStatus_new" RENAME TO "ContentStatus";
DROP TYPE "ContentStatus_old";
ALTER TABLE "Project" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
ALTER TABLE "Article" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;
