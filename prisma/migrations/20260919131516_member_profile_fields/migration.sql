-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "RelationshipStatus" AS ENUM ('SINGLE', 'TAKEN', 'LOOKING', 'NOT_INTERESTED');

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "city" TEXT,
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "isNewLeo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "leoExperience" TEXT,
ADD COLUMN     "mylciId" TEXT,
ADD COLUMN     "relationshipStatus" "RelationshipStatus";
